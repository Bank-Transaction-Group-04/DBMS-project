const mysql = require('mysql2');

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "6222854",
  database: "banking_system"
});

module.exports=con;