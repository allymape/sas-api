require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const requestSummaryRouter = express.Router();
const model = require("../../models/maombi/anzishaShuleRequestModel")
const dateandtime = require("date-and-time");
var session = require("express-session"); 
const { isAuth, formatDate } = require("../../utils");
const sharedModel = require("../../models/sharedModel");

// List of 
requestSummaryRouter.get("/request_summaries/:application_category_id", isAuth,(req, res) => {
       const application_category_id = req.params.application_category_id;
       const user = req
       sharedModel.maombiSummaryByCategoryAndStatus(user , application_category_id , (data) =>{
           res.send({
                data : data
           })
       } )
  });
module.exports = requestSummaryRouter;
