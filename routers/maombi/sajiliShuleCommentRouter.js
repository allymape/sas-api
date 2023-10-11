require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const sajiliShuleCommentRouter = express.Router();
const dateandtime = require("date-and-time");
var session = require("express-session");
const { isAuth, formatDate, permission, selectConditionByTitle, selectStaffsBySection } = require("../../utils");
const sharedModel = require("../../models/sharedModel");
 
sajiliShuleCommentRouter.post("/tuma-sajili-majibu", isAuth, (req, res) => {
  const tracking_number = req.body.trackerId;
  const schoolCatId = req.body.schoolCategoryID;
  sharedModel.updateOrCreateRegistrationNumber(
    "EC-20230307-772",
    1,
    null,
    (created_registration_number) => {
      res.send({
        created_registration_number,
      });
    }
  );
  return;
  sharedModel.findOneApplication(tracking_number, (app) => {
    const app_category = app["application_category_id"];
    if (app_category) {
      sharedModel.tumaMaoni(req, app_category, (success) => {
          if (req.body.haliombi == 2) {
             sharedModel.updateOrCreateRegistrationNumber(tracking_number, schoolCatId, null,  (created_registration_number) => {
                console.log(
                  "Created registration number is " +
                    created_registration_number
                );
             });
          }
          return res.send({
            error: success ? false : true,
            statusCode: success ? 300 : 306,
            data: success ? "success" : "fail",
            message: success ? "Majibu Successfully Recorded." : "Kuna tatizo",
          });
      
      });
    }
  });
});

module.exports = sajiliShuleCommentRouter;
