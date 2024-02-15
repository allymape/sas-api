require("dotenv").config();
const express = require("express");
// const request = require("request");
const streetRouter = express.Router();
const http = require("http");
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin, formatDate, promiseRequest } = require("../utils.js");
const streetModel = require("../models/streetModel.js");
const axios  = require("axios");
const request = require("request-promise");


// List of streets
streetRouter.get("/allStreets", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var is_paginated = true;
  var ward_code = null;

  if (typeof req.body.is_paginated !== "undefined") {
    is_paginated =
      req.body.is_paginated == "false" || !req.body.is_paginated ? false : true;
    ward_code = req.body.ward_code;
  }
  streetModel.getAllStreets(offset, per_page, is_paginated , ward_code, (error, streets, numRows) => {
    // console.log(streets);
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : streets,
      numRows: numRows,
      message: "List of Streets.",
    });
  });
});

streetRouter.get("/lookup-streets", isAuth, (req, res) => {
  const { ward_code } = req.body;
  streetModel.lookupStreets(ward_code, (error, streets) => {
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : streets,
      message: "List of Streets.",
    });
  });
});

// Fetch all streets from Streets API and store
streetRouter.post("/usajiliMitaa", isAuth, async (req, res, next) => {
       var apiData = [];
       var results = await promiseRequest(admin_area_url , 'streets');
             //iterate through all datas received and store  to apiData array  
              for (let index = 0; index < results.length; index++) {
                    results[index].forEach((street_content) => {
                                apiData.push([
                                  street_content.id,
                                  street_content.village_uid,
                                  street_content.name,
                                  street_content.ward_uid,
                                  formatDate(new Date()),
                                  formatDate(new Date()),
                                ]);
                    });
              }

            if (apiData.length > 0) {
              //store data to database
                  streetModel.storeStreets(apiData, (isSuccess) => {
                    console.log("streets created successfully");
                    res.send({
                      statusCode: isSuccess ? 300 : 306,
                      message: isSuccess
                        ? "Umefanikiwa kupakia taarifa za Mitaa kikamilifu."
                        : "Haujafanikiwa kupakia Mitaa wasiliana na msimamizi wa Mfumo.",
                    });
                  });
            }else{
                res.send({
                  statusCode:  306,
                  message: "Haujafanikiwa kupakia Mitaa wasiliana na msimamizi wa Mfumo.",
                });
            }
});

module.exports = streetRouter;
