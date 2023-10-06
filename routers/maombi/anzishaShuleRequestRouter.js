require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const anzishaShuleRequestRouter = express.Router();
const model = require("../../models/maombi/anzishaShuleRequestModel")
const dateandtime = require("date-and-time");
var session = require("express-session"); 
const { isAuth, formatDate } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

// List of 
anzishaShuleRequestRouter.post("/maombi-kuanzisha-shule", isAuth,(req, res) => {
    var per_page = parseInt(req.query.per_page);
    var page = parseInt(req.query.page);
    var offset = (page - 1) * per_page;
    var is_paginated = true;
    if (typeof req.body.is_paginated !== "undefined") {
      is_paginated =
        req.body.is_paginated == "false" || !req.body.is_paginated
          ? false
          : true;
    }
    model.anzishaShuleRequestList(req.user , (error, data, numRows) => {
            return res.send({
                    error: error ? true : false,
                    statusCode: error ? 306 : 300,
                    data: error ? null : data,
                    numRows: numRows,
                    message: error ? "Something went wrong." : "List of maombi kuanzisha shule.",
                });
      }
    );
  }
);


anzishaShuleRequestRouter.post("/view-ombi-details", isAuth, (req, res) => {
      // console.log("ni",req.body);
      var trackingNumber = req.body.TrackingNumber;
      var user = req.user;
      var objAttachment = [];
    // console.log(cheo , sehemu);
      sharedModel.findApplication(trackingNumber , (obj , objAttachment1 , objAttachment2 , objMess) => {
        sharedModel.myStaffs(user, (objStaffs) => {
           sharedModel.myMaoni(trackingNumber, (objMaoni) => {
             return res.send({
               error: false,
               statusCode: 300,
               data: obj,
               maoni: objMess,
               objAttachment: objAttachment,
               objAttachment1: objAttachment1,
               objAttachment2: objAttachment2,
               staffs: objStaffs,
              //  status: objApps,
               Maoni: objMaoni,
               message: "Taarifa za ombi kuanzisha shule.",
             });
           });
        });
      }
    );
});

anzishaShuleRequestRouter.post("/tuma-ombi-majibu", isAuth , (req, res) => {
      const tracking_number = req.body.trackerId;
      console.log("maoni "+req.bpdy)
      sharedModel.findOneApplication( tracking_number, (app) => {
        const app_category = app["application_category_id"];
             if(app_category){
                  sharedModel.tumaMaoni(req, app_category, (success) => {
                    return res.send({
                      error: success ? false : true,
                      statusCode: success ? 300 : 306,
                      data: success ? "success" : "fail",
                      message: "Majibu Successfully Recorded.",
                    });
                  });
             }
      })
});


module.exports = anzishaShuleRequestRouter;
