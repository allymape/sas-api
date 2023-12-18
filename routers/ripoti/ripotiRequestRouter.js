require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const ripotiRequestRouter = express.Router();
const model = require("../../models/maombi/anzishaShuleRequestModel")
const dateandtime = require("date-and-time");
var session = require("express-session"); 
const { isAuth, formatDate } = require("../../utils");
const sharedModel = require("../../models/sharedModel");
const reportModel = require("../../models/maombi/reportModel");

// List of 
ripotiRequestRouter.get("/ripoti-kuanzisha-shule", isAuth,(req, res) => {
    const per_page = parseInt(req.body.per_page);
    const page = parseInt(req.body.page);
    const offset = (page - 1) * per_page; //(0 , 10, 20,30)
    const sqlJoin = `FROM applications a`;
    const sqlRows = `SELECT a.tracking_number AS tracking_number , a.is_approved AS status 
                     ${sqlJoin} 
                     LIMIT ?, ?`;
    const sqlCount = `SELECT COUNT(*) AS num_rows ${sqlJoin}`;
    // sqlRows =   SELECT tracking_number FROM application LIMIT 0,10
    reportModel.getData(sqlRows , sqlCount,(error, data, numRows) => {
            console.log(numRows , data)
            return res.send({
                    error: error ? true : false,
                    statusCode: error ? 306 : 300,
                    data: error ? error : data,
                    numRows: numRows,
                    message: error ? "Something went wrong." : "Ripoti ya kuanzisha shule.",
                });
      },
      [offset , per_page]
    );
  }
);

module.exports = ripotiRequestRouter;
