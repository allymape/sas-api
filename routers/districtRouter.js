require("dotenv").config();
const express = require("express");
const request = require("request");
const districtRouter = express.Router();
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin, formatDate, promiseRequest } = require("../utils.js");
const districtModel = require("../models/districtModel.js");
// districtRouter.use(
//   session({
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true,
//   })
// );


// List of disticts
districtRouter.get("/allDistricts", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var is_paginated = true;
  var region_code = null;
  if (typeof req.body.is_paginated !== "undefined") {
    is_paginated =
      req.body.is_paginated == "false" || !req.body.is_paginated ? false : true;
    region_code  = req.body.region_code;
  }
  districtModel.getAllDistricts(
    offset,
    per_page,
    is_paginated,
    region_code,
    (error, districts, numRows) => {
      return res.send({
        error: error ? true : false,
        statusCode: error ? 306 : 300,
        data: error ? [] : districts,
        numRows: numRows,
        message: "List of Disticts.",
      });
    }
  );
});
// Fetch all councils from councils API and store
districtRouter.post("/usajiliWilaya", isAuth, async (req, res, next) => {
       var apiData = [];
       var results = await promiseRequest(admin_area_url , 'councils' , 200);
             //iterate through all datas received and store  to apiData array  
              for (let index = 0; index < results.length; index++) {
                    results[index].forEach((ward_content) => {
                          apiData.push([
                              ward_content.id,
                              ward_content.district_uid,
                              ward_content.name,
                              ward_content.region_uid,
                              formatDate(new Date()),
                              formatDate(new Date()),
                          ]);
                    });
              }

            if (apiData.length > 0) {
              //store data to database
                  districtModel.storeDistricts(apiData, (isSuccess) => {
                    console.log("councils created successfully");
                    res.send({
                      statusCode: isSuccess ? 300 : 306,
                      message: isSuccess
                        ? "Umefanikiwa kupakia taarifa za Halmashauri kikamilifu."
                        : "Haujafanikiwa kupakia Halmashauri wasiliana na msimamizi wa Mfumo.",
                    });
                  });
            }else{
                res.send({
                  statusCode:  306,
                  message: "Haujafanikiwa kupakia Halmashauri wasiliana na msimamizi wa Mfumo.",
                });
            }
});

module.exports = districtRouter;
