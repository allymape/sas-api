require("dotenv").config();
const express = require("express");
const request = require("request");
const zoneRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");
const zoneModel = require("../models/zoneModel.js");
var session = require("express-session");
zoneRouter.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
// List of zones
zoneRouter.get("/allZones", isAuth, permission('view-zones'), (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var is_paginated = true;
        if (typeof req.body.is_paginated !== "undefined") {
            is_paginated =
              req.body.is_paginated == "false" || !req.body.is_paginated
                ? false
                : true;
        }
  zoneModel.getAllZones(offset, per_page, is_paginated , (error, zones, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? error : zones,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of Zones.",
            });
  });
});
// Edit Zone
zoneRouter.get("/editZone/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  zoneModel.findZone(id, (error , success, zone) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? zone : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store zone
zoneRouter.post("/addZone", isAuth, (req, res, next) => {
            var data = [];
            var name = req.body.zoneName.trim();
            var display = req.body.displayName.trim();
            data.push([
                    name.replace(/ /g, "-").toLowerCase(),
                    display,
                    1,
                    formatDate(new Date()),
                    req.user.id,
            ]);
    
            zoneModel.storeZone(data , (error , success , result) => {
                     return res.send({
                       success: success ? true : false,
                       statusCode: success ? 300 : 306,
                       data: success ? result : error,
                       message: success
                         ? "Umefanikiwa kusajili zone."
                         : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
            });
});

// Store zone
zoneRouter.put("/updateZone/:id", isAuth, (req, res, next) => {
            var data = [];
            var name = req.body.zoneName.trim().replace(/ /g, "-").toLowerCase();
            var display = req.body.displayName.trim();
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var id = Number(req.params.id);
            data.push([
                        ,
                        display,
                        status,
                        id
            ]);
    
            zoneModel.updateZone(name , display , status , id , (error , success , zone) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? zone : error,
                        message: success ? "Umefanikiwa kubadili zone." : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store zone
zoneRouter.delete("/deleteZone/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            zoneModel.deleteZone(id , (error , success , zone) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? zone : error,
                        message: success ? "Umefanikiwa kufuta zone." : error,
                     });
                    
            });
});

module.exports = zoneRouter;
