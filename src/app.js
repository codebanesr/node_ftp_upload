const Client = require('ftp');
const { processFile } = require('./processfile');
const mysql = require('mysql');
require('dotenv').config();

console.log({host: process.env.host})

const ftpConnect = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASS
}

const dbConn = mysql.createPool({
  host: process.env.SVR,
  user: process.env.USERDB,
  password: process.env.PASSDB,
  database: process.env.DBNAME
});


let ftpConn = new Client();
ftpConn.connect(ftpConnect);

/**
 * Once this connection is ready we pass it to every other function that needs it as an 
 * argument. There are some dependency injection libraries that can be used but it will
 * be an overkill for something so small
 */
ftpConn.on('ready', function() {
  console.log("--- FTP server ready ---");
  // calling functions only if the connection is ready to accept requests. This was the reason
  // why our calls were not being processed initially
  processFile(ftpConn, dbConn);
});

ftpConn.on('error', function(e) {
  console.error(e);
})