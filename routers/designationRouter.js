require("dotenv").config();
const express = require("express");
const request = require("request");
const designationRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");
const designationModel = require("../models/designationModel.js");
const sharedModel = require("../models/sharedModel.js");

function getSearchValue(req) {
  const rawSearch = req.query.search ?? req.body?.search ?? "";
  if (rawSearch && typeof rawSearch === "object") {
    return String(rawSearch.value || "").trim();
  }
  return String(rawSearch || "").trim();
}

// List of designations
designationRouter.get("/lookup_designations", isAuth, permission('view-designations'), (req, res, next) => {
  const hierarchy_id = req.query.hierarchy_id || req.body?.hierarchy_id || null;
  designationModel.lookupDesignations(hierarchy_id, (error , designations) => {
            sharedModel.getLevels((levels) => {
              return res.send({
                designations: error ? [] : designations,
                levels: levels,
              });
            });
  });
});

designationRouter.get(
  "/all_designations",
  isAuth,
  permission("view-designations"),
  (req, res) => {
    var per_page = parseInt(req.query.per_page || 10);
    var page = parseInt(req.query.page || 1);
    var offset = (page - 1) * per_page;
    var search_value = getSearchValue(req);
    
    designationModel.getAllDesignations(
      offset,
      per_page,
      search_value,
      (error, designations, numRows) => {
        return res.send({
          error: error ? true : false,
          statusCode: error ? 306 : 300,
          data : error ? error : designations,
          numRows: numRows,
          message: error ? "Something went wrong." : "List of designations.",
        });
      }
    );
  }
);

designationRouter.get("/designations_by_section", isAuth, (req, res, next) => {
  var hierarchy_id = req.query.hierarchy_id || req.body?.hierarchy_id || null;
  designationModel.lookupDesignations( hierarchy_id, (error, designations) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                designations: error ? [] : designations,
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
            var description = req.body.description
            var level = req.body.level;
            data.push(name, description,level, 1, formatDate(new Date()));
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
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var id = Number(req.params.id);
            const {name ,description, level} = req.body
            data.push(name, description , level,status, formatDate(new Date()), id);
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
            designationModel.deleteDesignation(id , (error , success , designation) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? designation : error,
                        message: success ? "Umefanikiwa kufuta designation." : error,
                     });
                    
            });
});

module.exports = designationRouter;
