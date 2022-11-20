const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

const { Router } = require('./router');
require("./event");
const port = process.env.PORT || 4005;
let runningMessage = 'Server is running on port ' + port;


app.use(cors());
app.use(
  bodyParser.json({
    limit: "15360mb",
    type: "application/json",
  })
);

app.use(
  bodyParser.urlencoded({
    limit: "15360mb",
    extended: true,
    parameterLimit: 5000000,
    type: "application/json",
  })
);

Router(app);

const server = app.listen(port, () => {
  console.log(runningMessage);
});

