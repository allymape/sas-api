require("dotenv").config();
const express = require("express");
const request = require("request");
const districtRouter = express.Router();
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin, formatDate } = require("../utils.js");
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
  districtModel.getAllDistricts(
    offset,
    per_page,
    (error, districts, numRows) => {
      console.log(districts);
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

// Store disticts
districtRouter.get("/usajiliWilaya", isAuth, (req, res, next) => {
  request(
    {
      url: admin_area_url + "councils?per_page=1000",
      method: "GET",
      headers: {
        //   'Authorization': 'Bearer' + " " + req.session.Token,
        "Content-Type": "application/json",
      },
    },
    (error, response, body) => {
      if (error) {
        console.log(new Date() + ": fail to UsajiliGraph " + error);
        res.send("failed");
      }
      if (body !== undefined) {
        var jsonData = JSON.parse(body);
        var council_content = jsonData.data;
        var totalElements = jsonData.pagination.total;
        var values = [];
        console.log("totalElements " + totalElements);
        for (var i = 0; i < council_content.length; i++) {
          var council_id = council_content[i].id;
          var council_name = council_content[i].name;
          var council_code = council_content[i].district_uid;
          var region_code = council_content[i].region_uid;
          var created_at = formatDate(new Date());
          var updated_at = formatDate(new Date());
          
          values.push([
            council_id,
            council_code,
            council_name,
            region_code,
            created_at,
            updated_at,
          ]);
        }
        districtModel.storeDistricts(values, (success) => {
          console.log("Districts created successfully");
          return res.send({
            statusCode: success ? 300 : 306,
            message: success
              ? "Imefanikiwa kupakia Halmashauri mpya"
              : "Haijafanikiwa kupakia Halmashauri mpya",
          });
        });
      }
    }
  );
});

module.exports = districtRouter;
