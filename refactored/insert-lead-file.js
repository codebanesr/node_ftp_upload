const { promisify } = require('util');
const { getVendors } = require('./utils');

/** This function doesnot even use jdata why was it being sent ? */
async function insertLeadData(data, filename, dbConn) {

  let vendors = await getVendors(dbConn);
  let newLeadData = await processCsv(filename);

  // rework all this shit
  let AutoGroup_ID = autoGroupId;
  let currentDate = getDateFromFileName(filename);
  let DealerId = dealerId;

  /** @Todo this will asynchronously fire multiple database calls and won't wait for it to finish, 
   * this should be done in a batch with async await
   */
  const queryPromise = promisify(conn.query);
  for (let i = 0; i < newLeadData.length; i++) {
    for (let j = 0; j < vendors.length; j++) {
      if (newLeadData[i].LeadSourceGroup === vendors[j].VendorName) {
        let q = `INSERT INTO TrackedData (LeadSourceGroup_ID, TotalLeads,GoodLeads,BadLeads, DataDate, AutoGroup_ID, Dealer_ID, DuplicateLeads,BadOtherLeads,CustomersInfluenced,CoxAutoBuyingSignals,SoldfromLeads,AvgDaystoSale,InternetAttemptedContact,InternetActualContact,InternetAvgAttemptsToContact,ApptsSet,ApptsScheduled,ApptsConfirmed,ApptsShown,AvgDaystoApptSet,TotalVisits,InitialVisits,BeBackVisits,AvgDaystoInitialVisit,TotalFrontGross,AvgFrontGross,TotalBackGross,AvgBackGross,TotalGross,AvgGross,TotalCost,CostPerLead,CostPerSold,Profit) VALUES ('${vendors[j].LeadSourceGroup_ID}','${newLeadData[i].TotalLeads}', '${newLeadData[i].GoodLeads}', '${newLeadData[i].BadLeads}', '${currentDate}', '${AutoGroup_ID}','${DealerId}','${newLeadData[i].DuplicateLeads}','${newLeadData[i].BadOtherLeads}','${newLeadData[i].CustomersInfluenced}','${newLeadData[i].CoxAutoBuyingSignals}','${newLeadData[i].SoldfromLeads}','${newLeadData[i].AvgDaystoSale}','${newLeadData[i].InternetAttemptedContact}','${newLeadData[i].InternetActualContact}','${newLeadData[i].InternetAvgAttemptstoContact}','${newLeadData[i].ApptsSet}','${newLeadData[i].ApptsScheduled}','${newLeadData[i].ApptsConfirmed}','${newLeadData[i].ApptsShown}','${newLeadData[i].AvgDaystoApptSet}','${newLeadData[i].TotalVisits}','${newLeadData[i].InitialVisits}','${newLeadData[i].BeBackVisits}','${newLeadData[i].AvgDaystoInitialVisit}','${newLeadData[i].TotalFrontGross}','${newLeadData[i].AvgFrontGross}','${newLeadData[i].TotalBackGross}','${newLeadData[i].AvgBackGross}','${newLeadData[i].TotalGross}','${newLeadData[i].AvgGross}','${newLeadData[i].TotalCost}','${newLeadData[i].CostPerLead}','${newLeadData[i].CostPerSold}','${newLeadData[i].Profit}')`;
        try {
          await queryPromise(q);
        }catch(e) {
          console.log("An error occured", e.message);
        }
      }
    }
  }

  console.log("Finished processing file with name -> ", filename)
}


module.exports = { insertLeadData }
