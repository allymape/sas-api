require("dotenv").config();
const express = require("express");
const request = require("request");
const permissionRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, paramCase, sentenceCase } = require("../utils.js");
const permissionModel = require("../models/permissionModel.js");


// List of permissions
permissionRouter.get("/allPermissions", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page || 10);
  var page = parseInt(req.query.page || 1);
  var offset = (page - 1) * per_page;
  var is_paginated = true;
  var status = false;
  var is_default = null;
  var search = req.body?.tafuta || req.query?.tafuta || null;
  if (typeof req.body.is_paginated !== "undefined") {
    is_paginated =
      req.body.is_paginated == "false" || !req.body.is_paginated ? false : true;
  }
  if (typeof req.query.status !== "undefined") {
     status = req.query.status == "false" || req.query.status == "0" ? false : true;
  } else if (typeof req.body.status !== "undefined") {
     status = req.body.status == "false" ? false : true;
  }

  if (typeof req.query.is_default !== "undefined") {
    is_default = req.query.is_default == "1" || req.query.is_default === "true";
  } else if (typeof req.body.is_default !== "undefined") {
    is_default = req.body.is_default == "1" || req.body.is_default === "true";
  }

  permissionModel.getAllPermission(offset, per_page, is_paginated , search ,(error, permissions, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? [] : permissions,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of Permissions.",
            });
  } , status, is_default);
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
            var moduleId = Number(req.body.module_id || req.body.moduleId || 0);

            if (!moduleId || moduleId < 1) {
              return res.send({
                success: false,
                statusCode: 306,
                data: [],
                message: "Moduli ya permission ni lazima.",
              });
            }

            data.push([
                    name,
                    moduleId,
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
            var moduleId = Number(req.body.module_id || req.body.moduleId || 0);
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var is_default = req.body.is_default == "on" || req.body.is_default == 1 ? true : false ;
            var id = Number(req.params.id);

            if (!moduleId || moduleId < 1) {
              return res.send({
                success: false,
                statusCode: 306,
                data: [],
                message: "Moduli ya permission ni lazima.",
              });
            }
            
            permissionModel.updatePermission(name , moduleId, display , status , is_default , id , (error , success , permission) => {
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
