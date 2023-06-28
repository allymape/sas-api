require("dotenv").config();
const express = require("express");
const request = require("request");
const regionRouter = express.Router();
var admin_area_url = process.env.LOCATIONS_API_BASE_URL;
const { isAuth, isAdmin , formatDate , permit } = require("../utils.js");
const regionModel = require("../models/regionModel.js");
var session = require("express-session");
regionRouter.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
// List of regions
regionRouter.get("/regions", isAuth, permit("Tazama-Orodha-Mikoa"), (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  regionModel.getAllRegions(offset, per_page, (error, regions, numRows) => {
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : regions,
      numRows: numRows,
      message: "List of Regions.",
    });
  });
});

// Store regions
regionRouter.get("/usajiliMikoa", isAuth, (req, res, next) => {
  request({
      url: admin_area_url + "regions?per_page=100",
      method: "GET",
      headers: {
        //   'Authorization': 'Bearer' + " " + req.session.Token,
        "Content-Type": "application/json",
      }
    },(error, response, body) => {
      if (error) {
                console.log(new Date() + ": fail to UsajiliGraph " + error);
                res.send("failed");
      }
      if (body !== undefined) {
                var jsonData = JSON.parse(body);
                var regi_content = jsonData.data;
                var totalElements = jsonData.pagination.total;
                var values = [];
                console.log("totalElements " + totalElements);
      
              for (var i = 0; i < regi_content.length; i++) {
                    var reg_id     = regi_content[i].id;
                    var reg_name   = regi_content[i].name;
                    var reg_code   = regi_content[i].region_uid;
                    var created_at = formatDate(new Date());
                    var updated_at = formatDate(new Date());
                    values.push([
                                reg_id,
                                reg_code,
                                reg_name,
                                created_at,
                                updated_at,
                                ]);
              }
            regionModel.storeRegions(values , (success) => {
                console.log("Regions created successfully");
                     return res.send({
                       statusCode: success ? 300 : 306,
                       message: success
                         ? "Imefanikiwa kupakia mikoa mipya"
                         : "Haijafanikiwa kupakia mikoa mipya",
                     });
            })}
        }
  );
});

module.exports = regionRouter;
