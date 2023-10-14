require("dotenv").config();
const express = require("express");
const request = require("request");
const designationRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");
const designationModel = require("../models/designationModel.js");
var session = require("express-session");
designationRouter.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
// List of designations
designationRouter.get("/all_designations", isAuth, permission('view-designations'), (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var hierarchy_id = null;
  var is_paginated = true;
        if (typeof req.body.is_paginated !== "undefined") {
            is_paginated =
              req.body.is_paginated == "false" || !req.body.is_paginated
                ? false
                : true;
            hierarchy_id = req.body.hierarchy_id
        }
  designationModel.getAllDesignations(offset, per_page, is_paginated , hierarchy_id, (error, designations,levels, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                designations: error ? null : designations,
                levels: error ? null : levels,
                numRows: numRows,
                is_paginated : is_paginated,
                message: error ? "Something went wrong." : "List of designations.",
            });
  });
});

designationRouter.get("/designations_by_section", isAuth, (req, res, next) => {
  var hierarchy_id = req.body.hierarchy_id
  designationModel.lookupDesignations( hierarchy_id, (error, designations) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                designations: error ? null : designations,
                message: error ? "Something went wrong." : "List of designations.",
            });
  });
});
// Edit designation
designationRouter.get("/edit_designation/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  designationModel.findDesignation(id, (error , success, designation) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? designation : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store designation
designationRouter.post("/add_designation", isAuth, (req, res) => {
            var data = [];
            var name = req.body.name;
            var level = req.body.level;
            data.push(name,level,1,formatDate(new Date()));
            designationModel.storeDesignation(data, (error, success, result, duplicate = false) => {
                return res.send({
                  success: success ? true : false,
                  statusCode: success ? 300 : 306,
                  data: success ? result : error,
                  message: duplicate
                    ? "Ooooh!  Cheo Kimeshasajiliwa."
                    : success
                    ? "Umefanikiwa kusajili designation."
                    : "Kuna shida tafadhali wasiliana na Msimamizi wa Mfumo. ",
                });
              }
            );
});

// Store designation
designationRouter.put("/update_designation/:id", isAuth, (req, res, next) => {
            var data = [];
            var name = req.body.name;
            var level = req.body.level
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var id = Number(req.params.id);
            data.push(name,level,status, formatDate(new Date()), id);
            designationModel.updateDesignation(data, (error , success , designation , duplicate = false) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? designation : error,
                        message: duplicate ? 'Ooooh!  Cheo Kimeshasajiliwa.' : (success ? "Umefanikiwa kubadili designation." : "Kuna shida tafadhali wasiliana na Msimamizi wa Mfumo. "),
                     });
                    
            });
});

// Store designation
designationRouter.delete("/delete_designation/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            designationModel.deletedesignation(id , (error , success , designation) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? designation : error,
                        message: success ? "Umefanikiwa kufuta designation." : error,
                     });
                    
            });
});

module.exports = designationRouter;
