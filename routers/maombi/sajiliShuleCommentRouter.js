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
    if (app_category) {
      sharedModel.getSchoolCategoryForRegistration(tracking_number , (schoolCatId) => {
         if(schoolCatId){
               sharedModel.tumaMaoni(req, app_category, (isSuccess , message = null) => {
                 if (req.body.haliombi == 2 && isSuccess) {
                   sharedModel.updateOrCreateRegistrationNumber(
                     tracking_number,
                     schoolCatId,
                     null,
                     (created_registration_number) => {
                      sharedModel.createEventQueue(tracking_number , app_category , created_registration_number , (successQueue) => {
                         if(successQueue) console.log("Event Queue Registration number updated successfully")
                      })
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
                   error: isSuccess ? false : true,
                   statusCode: isSuccess ? 300 : 306,
                   data: isSuccess ? "success" : "fail",
                   message: isSuccess
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
