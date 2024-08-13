require("dotenv").config();
const express = require("express");
const request = require("request");
const hierarchyRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");
const hierarchyModel = require("../models/hierarchyModel.js");
var session = require("express-session");
// hierarchyRouter.use(
//   session({
//     secret: "secret",
//     resave: true,
//     saveUninitialized: true,
//   })
// );
// List of hierarchies
hierarchyRouter.get("/all_hierarchies", isAuth, permission('view-hierarchies'), (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
   var rank_id = null;
  var is_paginated = true;
        if (typeof req.body.is_paginated !== "undefined") {
            is_paginated =
              req.body.is_paginated == "false" || !req.body.is_paginated
                ? false
                : true;
            rank_id =  req.body.rank_id;
        }
  hierarchyModel.getAllHierarchies(offset, per_page, is_paginated , rank_id , (error, hierarchies, ranks, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                hierarchies: error ? null : hierarchies,
                ranks : error ? null : ranks,
                numRows: numRows,
                is_paginated : is_paginated,
                message: error ? "Something went wrong." : "List of Hierarchies.",
            });
  });
});
hierarchyRouter.get("/hierarchies_by_ranks", isAuth, (req, res, next) => {
  var rank_id = req.body.rank_id;
  const {user} = req;
  hierarchyModel.lookupHierarchies(rank_id , user, (error, hierarchies) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                hierarchies: error ? null : hierarchies,
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
            var name = req.body.name
            var rank = req.body.rank
            data.push([
                    name,
                    rank,
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
            var rank = req.body.rank
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var id = Number(req.params.id);
            data.push(
                name,
                rank,
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
            hierarchyModel.deletehierarchy(id , (error , success , hierarchy) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? hierarchy : error,
                        message: success ? "Umefanikiwa kufuta hierarchy." : error,
                     });
                    
            });
});

module.exports = hierarchyRouter;
