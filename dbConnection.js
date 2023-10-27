require('dotenv').config()
var mysql = require('mysql');
var conn = mysql.createConnection({
  host: process.env.DB_HOST || "localhost", // Replace with your host name
  user: process.env.DB_USERNAME, // Replace with your database username
  password: process.env.DB_PASSWORD, // Replace with your database password
  database: process.env.DB_DATABASE, // // Replace with your database Name
  timezone: process.env.TIMEZONE || "+03:00",
  multipleStatements: true,
  debug: false,
}); 
 
conn.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  };
  console.info(`Database is connected successfully! Server: ${process.env.DB_HOST}`);
});

conn.on("error" , (err) => {
  console.log("Mysql Error: "+ err);
})

module.exports = conn;