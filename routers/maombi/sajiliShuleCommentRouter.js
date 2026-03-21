require("dotenv").config();
const express = require("express");
const sajiliShuleCommentRouter = express.Router();
const db = require("../../config/database");
const { isAuth, InsertAuditTrail, notifyStaff, notifyMwombaji } = require("../../utils");
const sharedModel = require("../../models/sharedModel");
 
sajiliShuleCommentRouter.post("/tuma-sajili-majibu", isAuth, (req, res) => {
  const tracking_number = req.body.trackerId;
  const conditions = req.body.conditions;
  sharedModel.findOneApplication(tracking_number, (app) => {
    const app_category = app["application_category_id"];
    if (app_category) {
      sharedModel.getSchoolCategoryForRegistration(tracking_number , (schoolCatId) => {
         if(schoolCatId){
               db.beginTransaction((txError) => {
                 if (txError) {
                   console.log(txError);
                   return res.send({
                     error: true,
                     statusCode: 306,
                     data: "fail",
                     message: "Imeshindikana kuanzisha mchakato wa kuhifadhi maombi.",
                   });
                 }

                 const rollbackAndSend = (message) => {
                   db.rollback(() => {
                     return res.send({
                       error: true,
                       statusCode: 306,
                       data: "fail",
                       message: message || "Kuna tatizo",
                     });
                   });
                 };

                 sharedModel.tumaMaoni(
                   req,
                   app_category,
                   { use_existing_transaction: true, defer_side_effects: true, skip_event_queue: true },
                   (isSuccess, message = null, meta = null) => {
                     if (!isSuccess) {
                       rollbackAndSend(message || "Kuna tatizo");
                       return;
                     }

                     const afterCommitSideEffects = () => {
                       const rollId = Number(meta?.comment_id || 0) || null;
                       if (rollId) {
                         InsertAuditTrail(
                           req.user.id,
                           "created",
                           req.body,
                           req.url,
                           req.body.browser_used,
                           rollId,
                           "Maoni yameongezwa!",
                           req.body.ip_address,
                           "maoni",
                         );
                       }

                       notifyStaff(meta?.user_to || null, app_category, req.user?.name, tracking_number);
                       notifyMwombaji(tracking_number, req.body.haliombi);
                     };

                     const commitAndRespond = (finalMessage) => {
                       db.commit((commitError) => {
                         if (commitError) {
                           console.log(commitError);
                           rollbackAndSend("Imeshindikana kukamilisha mchakato wa kuhifadhi maombi.");
                           return;
                         }

                         afterCommitSideEffects();
                         return res.send({
                           error: false,
                           statusCode: 300,
                           data: "success",
                           message: finalMessage || "Majibu Successfully Recorded.",
                         });
                       });
                     };

                     if (Number(req.body.haliombi) !== 2) {
                       // Not approved -> no reg number issuance required.
                       commitAndRespond("Majibu Successfully Recorded.");
                       return;
                     }

                     sharedModel.updateOrCreateRegistrationNumber(
                       tracking_number,
                       schoolCatId,
                       null,
                       { use_existing_transaction: true },
                       (created_registration_number) => {
                         if (!created_registration_number) {
                           rollbackAndSend("Imeshindikana kutengeneza namba ya usajili.");
                           return;
                         }

                         sharedModel.createEventQueue(
                           tracking_number,
                           app_category,
                           created_registration_number,
                           (successQueue) => {
                             if (!successQueue) {
                               rollbackAndSend("Imeshindikana kuandaa foleni ya matukio (event queue).");
                               return;
                             }

                             sharedModel.updateSharti(tracking_number, conditions, (shartiOk) => {
                               if (!shartiOk) {
                                 rollbackAndSend("Imeshindikana kuhifadhi masharti ya usajili.");
                                 return;
                               }

                               commitAndRespond("Majibu Successfully Recorded.");
                             });
                           },
                         );
                       },
                     );
                   },
                 );
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
