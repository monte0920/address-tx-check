var mysql = require('mysql');
require('dotenv').config()
const { DBHOST, DATABASE, DBPORT, DBUSER, DBPASS } = process.env;

const DB = mysql.createConnection({
    host: DBHOST,
    user: DBUSER,
    password: DBPASS,
    port: DBPORT
});

DB.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

DB.query(`use ${DATABASE}`)

exports.DB = DB;