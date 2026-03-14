require("dotenv").config();
const express = require("express");
const request = require("request");
const hierarchyRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");
const hierarchyModel = require("../models/hierarchyModel.js");

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "undefined" || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return !["false", "0", "no"].includes(String(value).toLowerCase());
}

// List of hierarchies
hierarchyRouter.get("/all_hierarchies", isAuth, permission('view-hierarchies'), (req, res, next) => {
  var per_page = parseInt(req.query.per_page || 10);
  var page = parseInt(req.query.page || 1);
  var offset = (page - 1) * per_page;
  var rank_id = req.query.rank_id || req.body?.rank_id || null;
  var is_paginated = normalizeBoolean(
    req.query.is_paginated ?? req.body?.is_paginated,
    true
  );
  hierarchyModel.getAllHierarchies(offset, per_page, is_paginated , rank_id , (error, hierarchies, ranks, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                hierarchies: error ? [] : hierarchies,
                ranks : error ? [] : ranks,
                numRows: numRows,
                is_paginated : is_paginated,
                message: error ? "Something went wrong." : "List of Hierarchies.",
            });
  });
});
hierarchyRouter.get("/hierarchies_by_ranks", isAuth, (req, res, next) => {
  var rank_id = req.query.rank_id || req.body?.rank_id || null;
  const {user} = req;
  hierarchyModel.lookupHierarchies(rank_id , user, (error, hierarchies) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                hierarchies: error ? [] : hierarchies,
                message: error ? "Something went wrong." : "List of Hierarchies.",
            });
  });
});
// Edit hierarchy
hierarchyRouter.get("/edit_hierarchy/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  hierarchyModel.findHierarchy(id, (error , success, hierarchy) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? hierarchy : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store hierarchy
hierarchyRouter.post("/add_hierarchy", isAuth, (req, res, next) => {
            var data = [];
            var name = req.body.name;
            var unit_name = req.body.unit_name || null;
            var rank = req.body.rank;
            var overdue = Number(req.body.overdue);
            data.push([
                    name,
                    unit_name,
                    rank,
                    overdue,
                    1
            ]);
            hierarchyModel.storeHierarchy(data , (error , success , result) => {
                     return res.send({
                       success: success ? true : false,
                       statusCode: success ? 300 : 306,
                       data: success ? result : error,
                       message: success
                         ? "Umefanikiwa kusajili hierarchy."
                         : "Kuna shida tafadhali wasiliana na Msimamizi wa Mfumo. ",
                     });
            });
});

// Store hierarchy
hierarchyRouter.put("/update_hierarchy/:id", isAuth, (req, res, next) => {
            var data = [];
            var name = req.body.name;
            var unit_name = req.body.unit_name || null;
            var rank = req.body.rank;
            var overdue = Number(req.body.overdue);
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var id = Number(req.params.id);
            data.push(
                name,
                unit_name,
                rank,
                overdue,
                status,
                id
            );
            hierarchyModel.updateHierarchy(data, (error , success , hierarchy) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? hierarchy : error,
                        message: success ? "Umefanikiwa kubadili hierarchy." : "Kuna shida tafadhali wasiliana na Msimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store hierarchy
hierarchyRouter.delete("/delete_hierarchy/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            hierarchyModel.deleteHierarchy(id , (error , success , hierarchy) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? hierarchy : error,
                        message: success ? "Umefanikiwa kufuta hierarchy." : error,
                     });
                    
            });
});

module.exports = hierarchyRouter;
