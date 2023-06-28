require("dotenv").config();
const express = require("express");
const request = require("request");
const permissionRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit } = require("../utils.js");
const permissionModel = require("../models/permissionModel.js");
var session = require("express-session");
permissionRouter.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
// List of permissions
permissionRouter.get("/allPermissions", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  permissionModel.getAllPermission(offset, per_page, (error, permissions, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? [] : permissions,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of Permissions.",
            });
  });
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
            var name = req.body.permissionName.trim();
            var display = req.body.displayName.trim();
            data.push([
                    name.replace(/ /g, "-").toLowerCase(),
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
                         : "Kuna shida tafadhali wasiliana na Msimizi wa Mfumo. ",
                     });
            });
});

// Store permission
permissionRouter.put("/updatePermission/:id", isAuth, (req, res, next) => {
            var data = [];
            var name = req.body.permissionName.trim().replace(/ /g, "-").toLowerCase();
            var display = req.body.displayName.trim();
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var id = Number(req.params.id);
            data.push([
                        ,
                        display,
                        status,
                        id
            ]);
    
            permissionModel.updatePermission(name , display , status , id , (error , success , permission) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? permission : error,
                        message: success ? "Umefanikiwa kubadili permission." : "Kuna shida tafadhali wasiliana na Msimizi wa Mfumo. ",
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
