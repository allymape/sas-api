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
  const today = new Date();
  sharedModel.findOneApplication(tracking_number, (app) => {
    const app_category = app["application_category_id"];
    if (app_category) {
      sharedModel.tumaMaoni(req, app_category, (success) => {
      
          if (req.body.haliombi == 2) {
             sharedModel.updateAlgorithm(tracking_number, schoolCatId, () => {
                // console.log(updated);
               db.query(
                 `SELECT last_number FROM algorthm WHERE id = ?`,
                 [schoolCatId],
                 function (error, results, fields) {
                   if (error) {
                     console.log(error);
                   }
                   //  console.log(results);
                   var last_number = results[0].last_number;
                   let givenNo = parseInt(last_number);
                   var finalNumber;
                   if (schoolCatId == 1) {
                     finalNumber = "EA." + givenNo;
                   }
                   if (schoolCatId == 2) {
                     finalNumber = "EM." + givenNo;
                   }
                   if (schoolCatId == 3) {
                     finalNumber = "S." + givenNo;
                   }
                   if (schoolCatId == 4) {
                     finalNumber = "CU." + givenNo;
                   }
                   console.log("finalNumber11");
                   console.log(finalNumber);
                   db.query(
                     "UPDATE school_registrations SET registration_number = ?, registration_date = ?, updated_at = ?, " +
                       " reg_status = ? WHERE tracking_number = ?",
                     [
                       finalNumber,
                       formatDate(today, "YYYY-MM-DD"),
                       today,
                       2,
                       req.body.trackerId,
                     ],
                     function (error) {
                       if (error) {
                         console.log(error);
                       }

                       db.query(
                         "UPDATE algorthm SET last_number = ? WHERE id = ?",
                         [givenNo, schoolCatId],
                         function (error, results, fields) {
                           if (error) {
                             console.log(error);
                           }
                         }
                       );
                     }
                   );
                 }
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
