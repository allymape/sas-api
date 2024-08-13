require("dotenv").config();
const express = require("express");
const request = require("request");
const regionRouter = express.Router();
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin , formatDate , permit, promiseRequest } = require("../utils.js");
const regionModel = require("../models/regionModel.js");
var session = require("express-session");
const {
  // signupValidation,
  // loginValidation,
  // makundiValidation,
  shirikishoValidation,
  // memberValidation,
} = require("../validation");

// regionRouter.use(
//   session({
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true,
//   })
// );
// List of regions
regionRouter.get("/regions", isAuth, (req, res, next) => {
    var per_page = parseInt(req.query.per_page);
    var page = parseInt(req.query.page);
    var offset = (page - 1) * per_page;
    var is_paginated = true;
    var zone_id = null;
    if (typeof req.body.is_paginated !== "undefined") {
      is_paginated =
        req.body.is_paginated == "false" || !req.body.is_paginated
          ? false
          : true;
      zone_id = req.body.zone_id;
    }
    regionModel.getAllRegions(offset, per_page, is_paginated, zone_id, (error, regions, numRows) => {
      return res.send({
        error: error ? true : false,
        statusCode: error ? 306 : 300,
        data: error ? error : regions,
        numRows: numRows,
        message: "List of Regions.",
      });
    });
});

regionRouter.get("/lookup-regions", isAuth, (req, res, next) => {
    var zone_id = req.body.zone_id;
    const {user} = req
    regionModel.lookupRegions(user, zone_id, (error, regions) => {
      return res.send({
          error: error ? true : false,
          statusCode: error ? 306 : 300,
          data: error ? error : regions,
          message: "List of Regions.",
      });
    });
});

// Fetch all regions from regions API and store
regionRouter.post("/usajiliMikoa", isAuth, async (req, res, next) => {
       var apiData = [];
       var results = await promiseRequest(admin_area_url , 'regions' , 100);
             //iterate through all datas received and store  to apiData array  
              for (let index = 0; index < results.length; index++) {
                    results[index].forEach((region_content) => {
                                apiData.push([
                                    region_content.id,
                                    region_content.region_uid,
                                    region_content.name,
                                    formatDate(new Date()),
                                    formatDate(new Date()),
                                ]);
                    });
              }

            if (apiData.length > 0) {
              //store data to database
                  regionModel.storeRegions(apiData, (isSuccess) => {
                    console.log("Regions created successfully");
                    res.send({
                      statusCode: isSuccess ? 300 : 306,
                      message: isSuccess
                        ? "Umefanikiwa kupakia taarifa za Mikoa kikamilifu."
                        : "Haujafanikiwa kupakia Mikoa wasiliana na msimamizi wa Mfumo.",
                    });
                  });
            }else{
                res.send({
                  statusCode:  306,
                  message: "Haujafanikiwa kupakia Mikoa wasiliana na msimamizi wa Mfumo.",
                });
            }
});


// Update Region Zone
regionRouter.post("/assign-region-zone", isAuth, shirikishoValidation, (req, res, next) => {
  const { regionId, kanda, box, has_sqa_zone } = req.body;
  const has_zone_office =
    has_sqa_zone == "on" || has_sqa_zone == 'true' || has_sqa_zone ? 1 : 0;
  
  const formData = [kanda, box, has_zone_office, regionId];
  regionModel.updateRegionZone(formData, (error, success, result) => {
      return res.send({
        success: success ? true : false,
        statusCode: success ? 300 : 306,
        data: success ? result : error,
        message: success
          ? "Umefanikiwa kuusanisha Mkoa na Kanda."
          : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
      });
    });
});

module.exports = regionRouter;
