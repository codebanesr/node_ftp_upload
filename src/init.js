const { extractLeadSource } = require('./extract-lead-source');
const { insertLeadData } = require('./insert-lead-file');
const { processCsv } = require('./process-csv');
const { compareDbToCsvHeaders, getVendors } = require('./utils');

async function init(filename, conn, dbConn) {
  processCsv(filename, conn, dbConn)
    /** @Todo This piece of code was written twice so moved it to the top */
    .then(async (jData) => {
      /**@Todo Why even send jdata, the function doesnot use it */
      await insertLeadData(jData, filename, dbConn)
      return jData;
    })
    .then((headers) => {
      let extracted = extractLeadSource(headers);
      return Promise.resolve(extracted); /** return responses in Promise.resolve if you are planning to chain them */
    })
    .then((extracted) => {
      /** @Todo remove extracted, 
       * Get vendors doesnot take an input argument but `extracted` was provided in the original code
       * */
      const result = getVendors(dbConn)
        .then(data => {
          return compareDbToCsvHeaders(data, extracted, dbConn)
        });
      return Promise.resolve(result);
    })
    .then((vendorDifference) => {
      // let data;
      if (vendorDifference === 0) {
        return;
      } else {
        return Promise.resolve(vendorDifference);
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
      /** If you want to chain this data, use Promise.resolve or the promise constructor as used in prev step */
      return Promise.resolve(data)
    }); // INITIAL LEAD SOURCE GROUP CHECKING STOPS HERE


    /** @Todo seems like this is a duplicate code */
    // .then((data) => {
    //   console.log(data);
    //   processCsv(filename, conn) // PROBLEM ... RERUNNING THE SAME FUNCTION CREATING ANOTHER FTP CONNECTION FOR THE SAME DATA
    //     .then((jData) => {
    //       insertLeadData(jData)
    //     });

    //   return Promise.resolve(true);
    // })
}


module.exports = { init };