// This function only gets called, when we are actually connected to the ftp
const csv = require('fast-csv');
function processCsv(filename, ftpConn, dbConn) {
  return new Promise((resolve, reject) => {

    let results = [];
      ftpConn.get(filename, function (err, stream) {
        if (err) {
          console.error("Error occured for filename", filename)
          reject(err);
          throw err;
        }
        stream.once('close', function () { 
          /** @Todo do not close the connection here */
          console.log("Not closing the connection, because we want to process other files as well, and there is only one connection");
          // c.end(); 
        });
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
}


module.exports = {
  processCsv
}
