require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const anzishaShuleRequestRouter = express.Router();
const model = require("../../models/maombi/anzishaShuleRequestModel")
const dateandtime = require("date-and-time");
var session = require("express-session"); 
const { isAuth, formatDate, approvalStatuses } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

// List of 
anzishaShuleRequestRouter.post("/maombi-kuanzisha-shule", isAuth,(req, res) => {
    
    var is_paginated = true;
    const status = approvalStatuses(req.body.status);
    const sqlStatus = ` AND is_approved IN ${status ? status : "(0,1)"}`;
    // if (typeof req.body.is_paginated !== "undefined") {
    //   is_paginated =
    //     req.body.is_paginated == "false" || !req.body.is_paginated
    //       ? false
    //       : true;
    // }
    model.anzishaShuleRequestList(req , sqlStatus, (error, data, numRows) => {
      // console.log(numRows)
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
    // console.log(cheo , sehemu);
      sharedModel.findApplicationDetails(trackingNumber , (obj ,objAttachment, objAttachment1 , objAttachment2 , objMess) => {
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
      console.log(JSON.stringify(req.body));
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
