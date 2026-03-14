require("dotenv").config();
const express = require("express");
const request = require("request");
const zoneRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");
const zoneModel = require("../models/zoneModel.js");


// List of zones
zoneRouter.get("/allZones", isAuth, permission('view-zones'), (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  let search_value = req.body.search.value;
  zoneModel.getAllZones(offset, per_page, search_value , (error, zones, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? error : zones,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of Zones.",
            });
  });
});

zoneRouter.get("/lookup-zones", isAuth, (req, res) => {
  const {user} = req
  zoneModel.lookupZones(user, (error, zones) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? error : zones,
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
            var formData = [];
            var name = req.body.zonename;
            var code = req.body.zonecode;
            formData.push([
                    name,
                    code,
                    1,
                    formatDate(new Date())
                    // req.user.id,
            ]);
    
            zoneModel.storeZone(formData , (error , success , result) => {
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
            var formData = [];
            var name = req.body.zonename;
            var zone_code = req.body.zonecode;
            var status = req.body.statusid == "on" || Number(req.body.statusid) == 1 ? true : false ;
            var id = Number(req.params.id);
            var box = req.body.box === "" || req.body.box == null ? null : Number(req.body.box);
            var updatedAt = formatDate(new Date());
            formData.push(name,zone_code , box,status,updatedAt,id);
    
            zoneModel.updateZone( formData , (error , success , zone) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? zone : error,
                        message: success ? "Umefanikiwa kubadili zone." : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store zone
zoneRouter.put("/deleteZone/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            zoneModel.deleteZone(id , (error , success , zone) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? zone : [],
                        message: success ? "Umefanikiwa kufuta Kanda." : 'Haujafanikiwa kufuta kuna Tatizo, Tafadhali hakiki kama Kanda hii haijatumika kwanza',
                     });
                    
            });
});

module.exports = zoneRouter;
