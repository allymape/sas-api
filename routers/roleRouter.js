require("dotenv").config();
const express = require("express");
const request = require("request");
const roleRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, titleCase, headerCase } = require("../utils.js");
const roleModel = require("../models/roleModel.js");
var session = require("express-session");
roleRouter.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
// List of roles
roleRouter.get("/allRoles", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var is_paginated = true;
        if (typeof req.body.is_paginated !== "undefined") {
            is_paginated = req.body.is_paginated == 'false' ? false : true;
        }
  roleModel.getAllRoles(offset, per_page, is_paginated , (error, roles, numRows) => {
    // console.log(roles)
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? error : roles,
                numRows: numRows,
                is_paginated : is_paginated,
                message: error ? "Something went wrong." : "List of Roles.",
            });
  });
});

// Create Role
roleRouter.get("/createRole", isAuth, (req, res, next) => {
    var id = req.params.id;
  roleModel.findRole(id, (error , success , permissions  ) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data : permissions,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Edit Role
roleRouter.get("/editRole/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  roleModel.findRole(id, (error , success, role , permissions , role_permissions ) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                role: success ? role : error,
                permissions : permissions,
                role_permissions : role_permissions,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store role
roleRouter.post("/addRole", isAuth, (req, res, next) => {
            var roleData = [];
            var name = titleCase(req.body.roleName);
            var permissions = req.body.permissions;
            var userId = req.user.id;
            roleData.push([
                    name,
                    1,
                    formatDate(new Date()),
                    userId,
            ]);
    
            roleModel.storeRole(roleData ,userId, permissions, (error , success , result) => {
                     return res.send({
                       success: success ? true : false,
                       statusCode: success ? 300 : 306,
                       data: success ? result : error,
                       message: success
                         ? "Umefanikiwa kusajili role."
                         : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
            });
});

// Store role
roleRouter.put("/updateRole/:id", isAuth, (req, res, next) => {
             var roleData = [];
             var name = headerCase(req.body.roleName);
             var permissions = req.body.permissions;
             var roleId = Number(req.params.id);
             var userId = req.user.id;
             roleData.push(name,  roleId);
         
            roleModel.updateRole(roleData , userId, roleId, permissions, (error , success , role) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? role : error,
                        message: success ? "Umefanikiwa kubadili role." : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store role
roleRouter.delete("/deleteRole/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            roleModel.deleteRole(id , (error , success , role) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? role : error,
                        message: success ? "Umefanikiwa kufuta role." : error,
                     });
                    
            });
});

module.exports = roleRouter;
