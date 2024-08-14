require("dotenv").config();
const express = require("express");
const requestSummaryRouter = express.Router();
const { isAuth } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

// List of 
requestSummaryRouter.get("/request_summaries/:application_category_id", isAuth,(req, res) => {
       const application_category_id = req.params.application_category_id;
       const user = req.user
       sharedModel.maombiSummaryByCategoryAndStatus(user , application_category_id , null , (data) =>{
          // console.log(data) 
          res.send({
                dataSummary : data
           })
       } )
  });
module.exports = requestSummaryRouter;
