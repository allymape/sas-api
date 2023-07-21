require("dotenv").config();
const express = require("express");
const request = require("request");
const wardRouter = express.Router();
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin, formatDate, promiseRequest } = require("../utils.js");
const wardModel = require("../models/wardModel.js");
// wardRouter.use(
//   session({
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true,
//   })
// );

// List of Wards
wardRouter.get("/allwards", isAuth, (req, res, next) => {
        var per_page = parseInt(req.query.per_page);
        var page = parseInt(req.query.page);
        var offset = (page - 1) * per_page;
        var is_paginated = true;
        var lga_code = null;

        if (typeof req.body.is_paginated !== "undefined") {
          is_paginated = req.body.is_paginated == "false" || !req.body.is_paginated ? false : true;
          lga_code = req.body.lga_code;
        }

        wardModel.getAllWards(
            offset,
            per_page,
            is_paginated,
            lga_code,
            (error, wards, numRows) => {
            // console.log(wards);
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? [] : wards,
                numRows: numRows,
                message: "List of Wards.",
            });
            }
        );
});


// Fetch all wards from wards API and store
wardRouter.post("/usajiliKata", isAuth, async (req, res, next) => {
       var apiData = [];
       var results = await promiseRequest(admin_area_url , 'wards');
             //iterate through all datas received and store  to apiData array  
              for (let index = 0; index < results.length; index++) {
                    results[index].forEach((ward_content) => {
                                apiData.push([
                                    ward_content.id,
                                    ward_content.ward_uid,
                                    ward_content.name,
                                    ward_content.district_uid,
                                    formatDate(new Date()),
                                    formatDate(new Date()),
                                ]);
                    });
              }

            if (apiData.length > 0) {
              //store data to database
                  wardModel.storeWards(apiData, (isSuccess) => {
                    console.log("Wards created successfully");
                    res.send({
                      statusCode: isSuccess ? 300 : 306,
                      message: isSuccess
                        ? "Umefanikiwa kupakia taarifa za Kata kikamilifu."
                        : "Haujafanikiwa kupakia Kata wasiliana na msimamizi wa Mfumo.",
                    });
                  });
            }else{
                res.send({
                  statusCode:  306,
                  message: "Haujafanikiwa kupakia Kata wasiliana na msimamizi wa Mfumo.",
                });
            }
});
module.exports = wardRouter;
