require("dotenv").config();
const express = require("express");
const dashboardRouter = express.Router();
const { isAuth, permission, formatDate } = require("../utils.js");
const dashboardModel = require("../models/dashboardModel.js");
const sharedModel = require("../models/sharedModel.js");

//Summaries
dashboardRouter.get("/school-summaries" , isAuth , (req , res) => {
  const {user} = req;
    console.log("START ... here" , formatDate(new Date()))
    dashboardModel.getAllSummaries(user , (error , registrations ,categories , owners , applications , structures) => {
            console.log("END ... here", formatDate(new Date()));
            res.send({
               error: error ? true : false,
               statusCode: error ? 306 : 300,
               data: {registrations, owners, categories , applications , structures},
               message: error ? "Error" : "Summaries Success",
             });
    })

});
dashboardRouter.get("/dashboard-filters" , isAuth , (req , res) => {
  const {user} = req;
  sharedModel.getSchoolCategories((categories) => {
    sharedModel.getSchoolOwnerships((ownerships) => {
        sharedModel.getRegions(user , (regions) => {
          res.send({
            error: false,
            statusCode: 300,
            data: {categories , ownerships  , regions},
            message: "Success",
          });
      })
    })
  })
});
dashboardRouter.get("/map-data", isAuth, (req, res) => {
  console.log("Map Data")
      dashboardModel.getMapData(req, (data) => {
        return res.send({
          error: data ? false : true,
          statusCode: data ? 300 : 306,
          data: data,
          message: data ? "Success" : "Error",
        });
      });
});
dashboardRouter.post("/update-marker", isAuth, permission('update-school-marker'), (req, res) => {
  dashboardModel.updateMarker(req.body, (success) => {
    return res.send({
      statusCode: success ? 300 : 306,
      message: success ? "Marker is updated successfully" : "Error, Please contact Administrator",
    });
  });
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
