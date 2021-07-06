const { init } = require('./init');
const util = require('util');

const ftpPath = '/reports/dealers/covertford/crm/';

async function ftpList(conn) {
  return new Promise((resolve, reject) => {
    conn.list(ftpPath, function (err, list) {
          if (err) {
              reject(err);
          }
          resolve(list);
      });
  });
}



/** Here is what a promisified version of ftpList would look like, since ftpList doesnot
  * resolve into a promise, we can use a nodejs utility to convert it into a promise
*/
// const ftpList = async(conn) => {
//   const listPromise = util.promisify(conn.list);
//   const result = await listPromise(ftpPath);
//   return result;
// }

async function processFile(conn, dbConn) {
  let ftpFiles;
  try {
    ftpFiles = await ftpList(conn);
    console.log({ftpFiles})
  }catch(e) {
    console.trace(e.message + " -- Exiting");
    process.exit(0)
  }
  for (let i = 0; i < ftpFiles.length; i++) {
    if (ftpFiles[i].name.length > 3) {
      console.log('processing file #: ' + i);

      let csvFile = ftpFiles[i].name;
      let filename = ftpPath + csvFile;
      console.log(filename)
      
      // Timeout is now not required because we have made sure (in app.js) that the ftp server is ready to listen
      // to connections
      setTimeout(()=>{
        init(filename, conn, dbConn);
      }, 0);
    }
  }
}


module.exports = { processFile };