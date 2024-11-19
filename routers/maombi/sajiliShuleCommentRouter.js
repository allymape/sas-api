require("dotenv").config();
const express = require("express");
const sajiliShuleCommentRouter = express.Router();
const { isAuth} = require("../../utils");
const sharedModel = require("../../models/sharedModel");
 
sajiliShuleCommentRouter.post("/tuma-sajili-majibu", isAuth, (req, res) => {
  const tracking_number = req.body.trackerId;
  const conditions = req.body.conditions;
  sharedModel.findOneApplication(tracking_number, (app) => {
    const app_category = app["application_category_id"];
    var success =  false;
    if (app_category) {
      sharedModel.getSchoolCategoryForRegistration(tracking_number , (schoolCatId) => {
         if(schoolCatId){
               sharedModel.tumaMaoni(req, app_category, (isSuccess , message = null) => {
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
                 //  Insert sharti la usajili
                 console.log(tracking_number, conditions);
                 if (isSuccess && conditions) {
                   sharedModel.updateSharti(tracking_number, conditions);
                 }
                 return res.send({
                   error: success ? false : true,
                   statusCode: success ? 300 : 306,
                   data: success ? "success" : "fail",
                   message: success
                     ? "Majibu Successfully Recorded."
                     : message 
                     ?message 
                     : "Kuna tatizo",
                 });
               });
              
         }else{
          console.log("Kuna tatizo no schoolCatId");
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
