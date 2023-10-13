require("dotenv").config();
const express = require("express");
const request = require("request");
const roleRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, titleCase, headerCase, initiliazeRolesAndPermissions, permission } = require("../utils.js");
const roleModel = require("../models/roleModel.js");
var session = require("express-session");
const permissionModel = require("../models/permissionModel.js");
const rolePermissionModel = require("../models/rolePermissionModel.js");
roleRouter.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
// List of roles
roleRouter.get("/allRoles", isAuth, permission('view-roles'), (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var is_paginated = true;
        if (typeof req.body.is_paginated !== "undefined") {
            is_paginated =
              req.body.is_paginated == "false" || !req.body.is_paginated
                ? false
                : true;
        }
  roleModel.getAllRoles(offset, per_page, is_paginated , (error, roles, numRows) => {
    // console.log(roles)
            if(error) console.log(error);
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? "" : roles,
                numRows: numRows,
                is_paginated : is_paginated,
                message: error ? "Something went wrong." : "List of Roles.",
            });
  });
});
// Lookup
// List of roles Lookup
roleRouter.get("/roles", isAuth, (req, res) => {
  const {user} = req
  roleModel.lookupRoles(user, (error, roles) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? "" : roles,
                message: error ? "Something went wrong." : "List of Roles.",
            });
  });
});

// Create Role
// roleRouter.get("/createRole", isAuth, (req, res, next) => {
//     var id = req.params.id;
//   roleModel.findRole(id, (error , success , permissions  ) => {
//             return res.send({
//                 success: success ? true : false,
//                 statusCode: success ? 300 : 306,
//                 data : permissions,
//                 message: success ?  "Success" : "Not found",
//             });
//   });
// });

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
                        message: success ? "Umefanikiwa kufanya mabadiliko ya role hii." : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
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

// Initialize roles and permissions
roleRouter.post("/generate_roles_permissions" , isAuth, (req , res, next) => {
      try {
        console.log("Start Syncing Data ...");
        initiliazeRolesAndPermissions((roles, permissions, permission_role) => {
          console.log("Found " + roles.length + " roles");
          if (roles.length > 0) {
            roleModel.syncRoles(roles, (error, success, result) => {
              if (success) {
                console.log("Syncing roles is successfully. " + result.message);
                console.log("Found " + permissions.length + " permissions.");
                permissionModel.syncPermissions(permissions , (error2 , success2 , result2) =>{
                    if(success2){
                          console.log("Syncing permissions is successfully. " + result2.message);
                          console.log("Found " + permission_role.length + " permissions and roles.");
                          rolePermissionModel.syncRolePermission(permission_role , (error3 , success3 , result3) => {
                            if(success3){
                              console.log("Syncing permission role is successfully. " + result3.message);
                            }
                            res.send({
                                  statusCode : success3 ? 300 : 3006,
                                  message : success3 ? "Umefanikiwa kuingiza majukumu ya watumiaji na permissions" : "Haujafanikiwa kuna tatizo wasiliana na msimamizi wa Mfumo."
                              });
                          });
                    }else{
                       console.log(
                         "Syncing permissions failed due to. " + error2.message
                       );
                    }
                });
              } else {
                console.log("Syncing roles failed due to. " + error.message);
              }
            });
          }
        } , req.userId);
      } catch (error) {
        console.log("Error:   "+ error);
      }
});

module.exports = roleRouter;
