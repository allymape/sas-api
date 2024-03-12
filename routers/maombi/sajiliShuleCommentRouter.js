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
  sharedModel.findOneApplication(tracking_number, (app) => {
    const app_category = app["application_category_id"];
    var success =  false;
    if (app_category) {
      sharedModel.getSchoolCategoryForRegistration(tracking_number , (schoolCatId) => {
         if(schoolCatId){
               sharedModel.tumaMaoni(req, app_category, (isSuccess) => {
                success = isSuccess;
                 if (req.body.haliombi == 2) {
                   sharedModel.updateOrCreateRegistrationNumber(
                     tracking_number,
                     schoolCatId,
                     null,
                     (created_registration_number) => {
                       console.log(
                         "Created registration number is " +
                           created_registration_number
                       );
                     }
                   );
                 }
                  return res.send({
                    error: success ? false : true,
                    statusCode: success ? 300 : 306,
                    data: success ? "success" : "fail",
                    message: success
                      ? "Majibu Successfully Recorded."
                      : "Kuna tatizo",
                  });
               });
         }else{
           return res.send({
             error: false,
             statusCode:  306,
             data: "fail",
             message:  "Kuna tatizo",
           });
         }
          
      });
     
    }
  });
});

module.exports = sajiliShuleCommentRouter;
