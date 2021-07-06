const express = require('express');
const router = express.Router();
let Client = require('ftp');
let csv = require('fast-csv');
let fs = require('fs');
let mysql = require('mysql');

require('dotenv').config();

let ftpConnect = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASS
}

let conn = mysql.createPool({
  host: process.env.SVR,
  user: process.env.USERDB,
  password: process.env.PASSDB,
  database: process.env.DBNAME
});



let autoGroupId = 100;
let dealerId = 1001;
let ftpPath = '/reports/dealers/covertford/crm/';
let csvFile = 'CRM-Report-2021-07-05T06:03:35 00:00.csv'; // name of the file

let filename = ftpPath + csvFile;
//init(filename);
async function processFiles() {
  ftpPath = '/reports/dealers/covertford/crm/';


  let ftpFiles = await ftpList();

  for (let i = 0; i < ftpFiles.length; i++) {
    if (ftpFiles[i].name.length > 3) {
      console.log('processing file #: ' + i);

      let csvFile = ftpFiles[i].name;
      let filename = ftpPath + csvFile;
      console.log(filename)
      setTimeout(() => {
        init(filename);
      }, 5000)
    }
  }

}

processFiles();

// Run and check if we need to add any Lead Source Groups
function init(filename) {
  processCsv(filename)
    .then((jData) => { return jData })
    .then((headers) => {
      let extracted = extractLeadSource(headers);
      return extracted;
    })
    .then((extracted) => {
      //console.log(extracted);
      let result = getVendors(extracted)
        .then(data => {
          return compareDbToCsvHeaders(data, extracted)
        });

      return result;
      // pass this to existingHeaders function and compare there and return off of a promise
    })
    .then((vendorDifference) => {
      // let data;
      if (vendorDifference === 0) {
        return;
      } else {
        return vendorDifference;
      }
    })
    .then((data) => {

      return new Promise((resolve, reject) => {
        if (data) {
          console.log('Inserting new Lead Source ...');
          resolve(insertLeadSourceGroup(data));
        } else {
          resolve('No new Lead Source Groups to insert');
        }
      });
    })
    .then((data) => {
      return data
    }) // INITIAL LEAD SOURCE GROUP CHECKING STOPS HERE
    .then((data) => {
      console.log(data);
      processCsv(filename) // PROBLEM ... RERUNNING THE SAME FUNCTION CREATING ANOTHER FTP CONNECTION FOR THE SAME DATA
        .then((jData) => {
          insertLeadData(jData)
        })
    })
}

// Setup the next Async call here
async function insertLeadData(data) {

  let vendors = await getVendors();
  let newLeadData = await processCsv(filename);

  // rework all this shit
  let AutoGroup_ID = autoGroupId;
  let currentDate = getDateFromFileName(filename);
  let DealerId = dealerId;



  for (let i = 0; i < newLeadData.length; i++) {
    for (let j = 0; j < vendors.length; j++) {
      if (newLeadData[i].LeadSourceGroup === vendors[j].VendorName) {
        let q = `INSERT INTO TrackedData (LeadSourceGroup_ID, TotalLeads,GoodLeads,BadLeads, DataDate, AutoGroup_ID, Dealer_ID, DuplicateLeads,BadOtherLeads,CustomersInfluenced,CoxAutoBuyingSignals,SoldfromLeads,AvgDaystoSale,InternetAttemptedContact,InternetActualContact,InternetAvgAttemptsToContact,ApptsSet,ApptsScheduled,ApptsConfirmed,ApptsShown,AvgDaystoApptSet,TotalVisits,InitialVisits,BeBackVisits,AvgDaystoInitialVisit,TotalFrontGross,AvgFrontGross,TotalBackGross,AvgBackGross,TotalGross,AvgGross,TotalCost,CostPerLead,CostPerSold,Profit) VALUES ('${vendors[j].LeadSourceGroup_ID}','${newLeadData[i].TotalLeads}', '${newLeadData[i].GoodLeads}', '${newLeadData[i].BadLeads}', '${currentDate}', '${AutoGroup_ID}','${DealerId}','${newLeadData[i].DuplicateLeads}','${newLeadData[i].BadOtherLeads}','${newLeadData[i].CustomersInfluenced}','${newLeadData[i].CoxAutoBuyingSignals}','${newLeadData[i].SoldfromLeads}','${newLeadData[i].AvgDaystoSale}','${newLeadData[i].InternetAttemptedContact}','${newLeadData[i].InternetActualContact}','${newLeadData[i].InternetAvgAttemptstoContact}','${newLeadData[i].ApptsSet}','${newLeadData[i].ApptsScheduled}','${newLeadData[i].ApptsConfirmed}','${newLeadData[i].ApptsShown}','${newLeadData[i].AvgDaystoApptSet}','${newLeadData[i].TotalVisits}','${newLeadData[i].InitialVisits}','${newLeadData[i].BeBackVisits}','${newLeadData[i].AvgDaystoInitialVisit}','${newLeadData[i].TotalFrontGross}','${newLeadData[i].AvgFrontGross}','${newLeadData[i].TotalBackGross}','${newLeadData[i].AvgBackGross}','${newLeadData[i].TotalGross}','${newLeadData[i].AvgGross}','${newLeadData[i].TotalCost}','${newLeadData[i].CostPerLead}','${newLeadData[i].CostPerSold}','${newLeadData[i].Profit}')`;
        conn.query(q, function (err) {
          if (err) throw err;
          console.log('inserted');
        });
      }
    }
  }

}

function ftpList() {
  return new Promise((resolve, reject) => {
    let Client = require('ftp');

    let c = new Client();
    c.on('ready', function () {
      c.list(ftpPath, function (err, list) {
        if (err) {
          reject(err);
        }
        resolve(list);
        // c.end();
        c.end();
      });
    });
    c.connect(ftpConnect);
  });
}
let c = new Client();
c.connect(ftpConnect);
// Retrieves a CSV file from FTP and prepares the JSON data to be stripped
function processCsv(filename) {
  return new Promise((resolve, reject) => {

    let results = [];
    c.on('ready', function () {
      c.get(filename, function (err, stream) {
        if (err) {
          reject(err);
          throw err;
        }
        stream.once('close', function () { c.end(); });
        csv.parseStream(stream, { headers: true })
          .on("data", function (data) {
            results.push(data);
          })
          .on("end", function () {
            let str = JSON.stringify(results);
            let newData = str.split(" ").join("");
            let jData = JSON.parse(newData);
            //extratLeadSource(jData);
            resolve(jData);
          });
      });
    });
  });
}




// Abstracts the Lead Source Group from the current CSV file
function extractLeadSource(data) {
  let headers = [];
  for (let i = 0; i < data.length; i++) {
    headers.push(data[i].LeadSourceGroup);
  }

  return headers;
}


// Compares Lead Source Groups that exist in the DB to the Lead Source Groups in 
// memory from the current CSV
function compareDbToCsvHeaders(data, extracted) {
  // 1. Connect to DB and get Lead Source Groups
  // 2. Compare those against whats in headers
  // 3. Insert the ones that do not match

  return new Promise((resolve, reject) => {
    let existingVendors = [];
    let newVendors = [];

    // loop through existing vendors and push into existingVendor array
    for (let i = 0; i < data.length; i++) {
      existingVendors.push(data[i].VendorName);
    }

    // loop through incoming vendors and push into newVendor array
    for (let i = 0; i < extracted.length; i++) {
      newVendors.push(extracted[i]);
    }

    let diff = newVendors.filter(x => !existingVendors.includes(x));
    //let diff = existingVendors.filter(x => !newVendors.includes(x));

    if (diff.length == 0) {
      resolve(0);
    } else {
      resolve(diff);
    }
  });

}

function excelParse(data) {

  // this is bringing back individual object and not comma separated
  let workingData = JSON.parse(data);
  console.log(workingData);



  // Get all the first elements
  // match those against exsiting Lead Source Group in the DB
  // If they don't exist create them

  //---- once that is finished ---- //

  // match the data to the Lead Source Group and insert //
}


function getVendors() {
  return new Promise((resolve, reject) => {
    let q = 'SELECT * FROM LeadSourceGroup';
    conn.query(q, function (err, results) {
      if (err) {
        reject(err);
      }
      let vendors = [];
      for (let i = 0; i < results.length; i++) {
        vendors.push({ LeadSourceGroup_ID: results[i].LeadSourceGroup_ID, VendorName: results[i].Name });
      }
      resolve(vendors);
    })
  });
}

function insertLeadSourceGroup(data) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < data.length; i++) {
      let q = `INSERT INTO LeadSourceGroup (Name) VALUES ('${data[i]}')`;
      conn.query(q, (err) => {
        if (err) reject(err);
        resolve('inserted');
      })
    }
  });
}








// UTILITY FUNCTIONS
function getDateFromFileName(filename) {
  let str = filename;
  let arr = str.split('-');
  let year = arr[2];
  let month = arr[3];
  let rest = arr[4];
  let day = rest.split('T');
  day = day[0];

  let fileDate = month + '-' + day + '-' + year;
  let d = new Date(fileDate);
  d.setDate(d.getDate() - 1);
  let finalDate = d.toLocaleDateString();

  let splitDate = finalDate.split('/');
  let sYear = splitDate[2];
  let sMonth = splitDate[0];
  let sDay = splitDate[1];

  if (sMonth < 10) {
    sMonth = '0' + sMonth
  }

  if (sDay < 10) {
    sDay = '0' + sDay
  }


  let storeDate = sYear + '-' + sMonth + '-' + sDay;
  return storeDate;
}

function isoToMs(date) {
  let d = new Date(date);
  let month = d.getMonth() + 1;
  let year = d.getFullYear();
  let day = d.getDate();
  let time = d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();

  return `${month}/${day}/${year} | ${time}`;
  // new Date(ms).toISOString() - convert ms to iso
}

function cleanFileName(file) {
  return file.split(" ").join("").replace(/:/g, '-')
}

function insertDate() {
  var d = new Date();
  let year = d.getFullYear();
  let month = d.getMonth() + 1;
  let date = d.getDate();

  return year + '-' + month + '-' + date
}

module.exports = router;