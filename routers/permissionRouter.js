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
            permissionModel.hasModuleId((schemaError, hasModuleId) => {
              return res.send({
                  error: error ? true : false,
                  statusCode: error ? 306 : 300,
                  data: error ? [] : permissions,
                  numRows: numRows,
                  hasModuleId: schemaError ? true : !!hasModuleId,
                  message: error ? "Something went wrong." : "List of Permissions.",
              });
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
            console.log("[Permissions][Create][API] Request", {
              url: "/api/v2/addPermission",
              method: "POST",
              payload: {
                permissionName: req.body.permissionName,
                displayName: req.body.displayName,
                module_id: req.body.module_id || req.body.moduleId,
              },
              user_id: req?.user?.id || null,
            });
            var data = [];
            var name = paramCase(req.body.permissionName);
            var display = sentenceCase(req.body.displayName);
            var moduleId = Number(req.body.module_id || req.body.moduleId || 0);

            if (!name || !String(name).trim()) {
              return res.send({
                success: false,
                statusCode: 306,
                data: [],
                message: "Permission name is required.",
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
                     const rawErrorMessage = String(error?.message || error?.sqlMessage || "").trim();
                     const normalizedErrorMessage = rawErrorMessage.toLowerCase();
                     const isDuplicate =
                       rawErrorMessage === "Permission already exists."
                       || normalizedErrorMessage.includes("duplicate")
                       || normalizedErrorMessage.includes("permission already exists");
                     const isInvalidModule =
                       rawErrorMessage === "Invalid module_id."
                       || normalizedErrorMessage.includes("invalid module_id");
                     return res.send({
                       success: success ? true : false,
                       statusCode: success ? 300 : 306,
                       data: success ? result : error,
                       message: success
                         ? "Umefanikiwa kusajili permission."
                         : (isDuplicate
                             ? "Permission already exists."
                             : (isInvalidModule
                                 ? "Invalid module_id."
                                 : (rawErrorMessage || "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. "))),
                     });
            });
});

// Store permission
permissionRouter.put("/updatePermission/:id", isAuth, (req, res, next) => {
            console.log("[Permissions][Update][API] Request", {
              url: "/api/v2/updatePermission/" + req.params.id,
              method: "PUT",
              payload: {
                permissionName: req.body.permissionName,
                displayName: req.body.displayName,
                module_id: req.body.module_id || req.body.moduleId,
                status: req.body.status,
                is_default: req.body.is_default,
              },
              user_id: req?.user?.id || null,
            });
            var name = paramCase(req.body.permissionName);
            var display = sentenceCase(req.body.displayName);
            var moduleId = Number(req.body.module_id || req.body.moduleId || 0);
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var is_default = req.body.is_default == "on" || req.body.is_default == 1 ? true : false ;
            var id = Number(req.params.id);

            if (!id || id < 1) {
              return res.send({
                success: false,
                statusCode: 306,
                data: [],
                message: "Invalid permission id.",
              });
            }

            if (!name || !String(name).trim()) {
              return res.send({
                success: false,
                statusCode: 306,
                data: [],
                message: "Permission name is required.",
              });
            }

            if (!display || !String(display).trim()) {
              return res.send({
                success: false,
                statusCode: 306,
                data: [],
                message: "Display name is required.",
              });
            }
            
            permissionModel.updatePermission(name , moduleId, display , status , is_default , id , (error , success , permission) => {
                     const rawErrorMessage = String(error?.message || error?.sqlMessage || "").trim();
                     const normalizedErrorMessage = rawErrorMessage.toLowerCase();
                     const isDuplicate =
                       rawErrorMessage === "Permission already exists."
                       || normalizedErrorMessage.includes("duplicate")
                       || normalizedErrorMessage.includes("permission already exists");
                     const isInvalidModule =
                       rawErrorMessage === "Invalid module_id."
                       || normalizedErrorMessage.includes("invalid module_id");
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? permission : error,
                        message: success
                          ? "Umefanikiwa kubadili permission."
                          : (isDuplicate
                              ? "Permission already exists."
                              : (isInvalidModule
                                  ? "Invalid module_id."
                                  : (rawErrorMessage || "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. "))),
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
