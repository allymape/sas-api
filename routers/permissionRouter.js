require("dotenv").config();
const express = require("express");
const request = require("request");
const permissionRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, paramCase, sentenceCase } = require("../utils.js");
const permissionModel = require("../models/permissionModel.js");


// List of permissions
permissionRouter.get("/allPermissions", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var is_paginated = true;
  var status = false;
  var search = req.body.tafuta;
  if (typeof req.body.is_paginated !== "undefined") {
    is_paginated =
      req.body.is_paginated == "false" || !req.body.is_paginated ? false : true;
  }
  if (typeof req.body.status !== "undefined") {
     status = req.body.status == "false" ? false : true;
  }

  permissionModel.getAllPermission(offset, per_page, is_paginated , search ,(error, permissions, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? [] : permissions,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of Permissions.",
            });
  } , status);
});
// Edit Permission
permissionRouter.get("/editPermission/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  permissionModel.findPermission(id, (error , success, permission) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? permission : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store permission
permissionRouter.post("/addPermission", isAuth, (req, res, next) => {
            var data = [];
            var name = paramCase(req.body.permissionName);
            var display = sentenceCase(req.body.displayName);
            data.push([
                    name,
                    display,
                    1,
                    formatDate(new Date()),
                    req.user.id,
            ]);
    
            permissionModel.storePermission(data , (error , success , result) => {
                     return res.send({
                       success: success ? true : false,
                       statusCode: success ? 300 : 306,
                       data: success ? result : error,
                       message: success
                         ? "Umefanikiwa kusajili permission."
                         : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
            });
});

// Store permission
permissionRouter.put("/updatePermission/:id", isAuth, (req, res, next) => {
            var name = paramCase(req.body.permissionName);
            var display = sentenceCase(req.body.displayName);
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var is_default = req.body.is_default == "on" || req.body.is_default == 1 ? true : false ;
            var id = Number(req.params.id);
            
            permissionModel.updatePermission(name , display , status , is_default , id , (error , success , permission) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? permission : error,
                        message: success ? "Umefanikiwa kubadili permission." : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store permission
permissionRouter.delete("/deletePermission/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            permissionModel.deletePermission(id , (error , success , permission) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? permission : error,
                        message: success ? "Umefanikiwa kufuta permission." : error,
                     });
                    
            });
});

module.exports = permissionRouter;
