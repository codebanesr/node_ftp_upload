function compareDbToCsvHeaders(data, extracted, dbConn) {
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


function getVendors(dbConn) {
  return new Promise((resolve, reject) => {
    let q = 'SELECT * FROM LeadSourceGroup';
    dbConn.query(q, function (err, results) {
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

function insertLeadSourceGroup(data, dbConn) {
  return new Promise((resolve, reject) => {
    for (let i = 0; i < data.length; i++) {
      let q = `INSERT INTO LeadSourceGroup (Name) VALUES ('${data[i]}')`;
      dbConn.query(q, (err) => {
        if (err) reject(err);
        resolve('inserted');
      })
    }
  });
}

module.exports = {
  insertLeadSourceGroup,
  getVendors,
  excelParse,
  compareDbToCsvHeaders
}