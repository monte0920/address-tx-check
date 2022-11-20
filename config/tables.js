const { DB } = require("./db");
const tablename = "transaction_history";


exports.create_table = () => {
    const field = "(id int(100) auto_increment primary key, transactionHash varchar(255), user varchar(255), rewardsToken varchar(255), reward int(255), updated boolean, transactionHash1 varchar(255))";
    DB.query(`CREATE TABLE IF NOT EXISTS ${tablename} ${field}`, (err, res) => {
        if (err) console.log(err);
        console.log("table created")
    });
}

exports.insert = (info) => {
    const id = Math.floor(Date.now());
    console.log(info);
    DB.query(`INSERT INTO ${tablename} VALUES(${id}, ${info.transactionHash}, ${info.user}, ${info.rewardsToken}, ${info.reward}, ${info.updated}, "")`, function (err, res) {
        if (err) console.log(err);
    });
}
