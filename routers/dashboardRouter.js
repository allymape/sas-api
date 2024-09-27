require("dotenv").config();
const express = require("express");
const dashboardRouter = express.Router();
const { isAuth, permission } = require("../utils.js");
const dashboardModel = require("../models/dashboardModel.js");

//Summaries
dashboardRouter.get("/school-summaries" , isAuth , (req , res) => {
  const {user} = req;
    dashboardModel.getAllSummaries(user , (error , registrations ,categories , owners , applications , structures) => {
            // console.log("dash data"); 
            res.send({
               error: error ? true : false,
               statusCode: error ? 306 : 300,
               data: {registrations, owners, categories , applications , structures},
               message: error ? "Error" : "Summaries Success",
             });
    })

});
dashboardRouter.get("/schools-summary-by-regions-and-categories", isAuth, (req, res) => {
  const { user } = req;

   dashboardModel.getSchoolByRegionsAndCategories(user , (data , minValue, maxValue) => {
    // console.log(data)
            return res.send({
              error: data ? false : true,
              statusCode: data ? 300 : 306,
              data: { data, minValue, maxValue },
              message: data ? "Success" : "Error",
            });
  });
});

dashboardRouter.get("/number-of-schools-by-year-of-regitration", isAuth , (req, res) => {
      let {user} = req;
      dashboardModel.getTotalNumberOfSchoolByYearOfRegistration( user , (individualData , cumulativeData) => {
             return res.send({
                   error : individualData ? false : true,
                   statusCode : individualData ? 300 : 306,
                   data : {
                    individualData : individualData , 
                    cumulativeData : cumulativeData
                   },
                   message : individualData ? 'Success' : 'Error'
             });
      })
})
// Change dashboard of school

module.exports = dashboardRouter;
