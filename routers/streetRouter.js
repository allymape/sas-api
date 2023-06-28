require("dotenv").config();
const express = require("express");
const request = require("request");
const streetRouter = express.Router();
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin, formatDate } = require("../utils.js");
const streetModel = require("../models/streetModel.js");
// streetRouter.use(
//   session({
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true,
//   })
// );

// List of streets
streetRouter.get("/allStreets", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  streetModel.getAllStreets(offset, per_page, (error, streets, numRows) => {
    console.log(streets);
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : streets,
      numRows: numRows,
      message: "List of Streets.",
    });
  });
});

// Store streets
streetRouter.get("/usajiliMitaa", isAuth, (req, res, next) => {
  request(
    {
      url: admin_area_url + "streets",
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
        var total_elements = jsonData.pagination.total;
        var per_page = 1000;
        var num_of_pages = Math.ceil(total_elements / per_page);
        var success = false;
        for (var index = 1; index <= num_of_pages; index++) {
          request(
            {
              url:
                admin_area_url +
                "streets?per_page=" +
                per_page +
                "&page=" +
                index,
              method: "GET",
              headers: {
                //   'Authorization': 'Bearer' + " " + req.session.Token,
                "Content-Type": "application/json",
              },
              //json: {trackingNo: trackingNo}
            },
            (error, response, body) => {
              if (error) {
                console.log(new Date() + ": fail to UsajiliGraph " + error);
                res.send("failed");
              }
              if (body !== undefined) {
                var jsonData = JSON.parse(body);
                var street_content = jsonData.data;
                var values = [];
                var success = false;
                //   console.log(jsonData.response.content)
                for (var i = 0; i < street_content.length; i++) {
                  var street_id = street_content[i].id;
                  var street_name = street_content[i].name;
                  var street_code = street_content[i].village_uid;
                  var ward_code = street_content[i].ward_uid;
                  var created_at = formatDate(new Date());
                  var updated_at = formatDate(new Date());
                  values.push([
                    street_id,
                    street_code,
                    street_name,
                    ward_code,
                    created_at,
                    updated_at,
                  ]);
                }

                streetModel.storeStreets(values, (success) => {
                  console.log("streets created successfully");
                  if (!success) {
                    return res.send({
                      statusCode: 306,
                      message: "Hajafanikiwa kupakia Mitaa yote kuna tatizo",
                    });
                  }
                });
              }
            }
          );
        }

        return res.send({
          statusCode: 300,
          message: "Imefanikiwa kupakia Mitaa mipya",
        });
      }
    }
  );
});

module.exports = streetRouter;
