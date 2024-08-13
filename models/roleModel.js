const db = require("../dbConnection");
const { formatDate, uniqueArray, mergeArray } = require("../utils");

module.exports = {
  //******** GET A LIST OF ROLES *******************************
  getAllRoles: (offset, per_page, is_paginated, callback) => {
    const roleQuery = `SELECT id as role_id, role_name , status_id
                      FROM role_management
                      ${is_paginated ? " LIMIT ?,?" : ""}`;
    db.query(
      roleQuery,
      is_paginated ? [offset, per_page] : [],
      (rolesErr, roleResults) => {
        if (rolesErr) {
          callback(rolesErr, null, 0);
          return;
        }
        if (!is_paginated) {
          //Return all roles without permissions if not paginated
          callback(rolesErr, roleResults, 0);
          return;
        }
        const rolePromises = roleResults.map((roleRow) => {
          const { role_id, role_name, status_id } = roleRow;
          const permissionQuery = `SELECT display_name, permission_name
                                    FROM permissions p
                                    JOIN permission_role pr ON pr.permission_id = p.id
                                    AND pr.role_id = ${role_id}`;
         
          return new Promise((resolvePermissions, rejectPermissions) => {
            db.query(permissionQuery, (permissionErr, permissionResults) => {
              if (permissionErr) {
                rejectPermissions(permissionErr);
              }
              const permissions = permissionResults.map(
                (permissionRow) => permissionRow.display_name
              );
              const permission_names = permissionResults.map(
                   (permissionRow) => permissionRow.permission_name
              );
              // console.log(permissions);
              resolvePermissions({
                id : role_id,
                role_name : role_name,
                status : status_id,
                permissions : permissions,
                permission_names: permission_names,
              });
            });
          });
        });

        Promise.all(rolePromises)
          .then((results) => {
            // console.log(results);
            db.query(
              `select COUNT(*) AS num_rows FROM role_management`,
              (error, result) => {
                // console.log(results)
                callback(null, results, result[0].num_rows);
              }
            );
          })
          .catch((error) => {
            callback(error, null, 0);
          })
          .finally(() => {
            // db.end();
          });
      }
    );
  },

  lookupRoles : (user,callback) => {
    db.query(
      `SELECT id as role_id, role_name
              FROM role_management
               ${
                 ["kanda", "wilaya"].includes(user.ngazi)
                   ? "WHERE LOWER(role_name) IN ('user' , 'normal user' , 'normal-user')"
                   : ""
               }
              `,
      (error, roles) => {
        if (error) console.log(error);
        callback(error, roles);
      }
    );
  },

  syncRoles: (roles, callback) => {
    try {
      var success = false;
      db.query(
        `SET FOREIGN_KEY_CHECKS = 0; truncate role_management; SET FOREIGN_KEY_CHECKS = 1;`,
        (err) => {
          if(err) console.log(err)
          db.query(
            `INSERT INTO role_management (id , role_name , status_id, created_at , created_by) 
          VALUES ? ON DUPLICATE KEY 
          UPDATE role_name = VALUES(role_name) , status_id = VALUES(status_id), created_by = VALUES(created_by) , created_at=VALUES(created_at)`,
            [roles],
            (error, result) => {
              if (error) {
                console.log(error);
              }
              if (result.affectedRows > 0) {
                success = true;
              }
              callback(error, success, result);
            }
          );
        }
      );
     
    } catch (error) {
      callback(error, false, []);
    }
  },
  //******** STORE ROLE *******************************
  storeRole: (roleData, userId, permissions, callback) => {
    var success = false;
    db.query(
      `INSERT INTO role_management (role_name , status_id, created_at , created_by) VALUES ?`,
      [roleData],
      (error, result) => {
        if (error) {
          console.log("Error", error);
        }
        if (result.affectedRows > 0 && permissions && permissions.length > 0) {
          syncPermissions(
            permissions,
            userId,
            result.insertId,
            (syncError, syncSuccess) => {
              callback(syncError, syncSuccess, result);
            }
          );
        } else {
          if (result.affectedRows > 0) {
            success = true;
          }
          callback(error, success, result);
        }
      }
    );
  },
  //******** FIND ROLE *******************************
  findRole: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , role_name 
        FROM role_management WHERE id = ?`,
      [id],
      (error, role) => {
        if (error) {
          console.log("Error", error);
        } else if (role.length > 0) {
          success = true;
          db.query(
            `SELECT * FROM permissions WHERE status_id = 1 ORDER BY permission_name ASC `,
            (error2, permissions) => {
              error = error2;
              // callback(error, success, role, permissions);
              // console.log(permissions);
              db.query(
                `SELECT permission_id FROM permissions, permission_role WHERE permissions.status_id = 1
                AND permissions.id = permission_role.permission_id AND permission_role.role_id = ?
                AND permission_role.status_id = 1`,
                [id],
                (error3, role_permissions) => {
                  error = error3;
                  callback(error, success, role, permissions, role_permissions);
                }
              );
            }
          );
        }
      }
    );
  },

  //******** UPDATE ROLE *******************************
  updateRole: (roleData, userId, roleId, permissions, callback) => {
    var success = false;

    db.query(
      `UPDATE  role_management SET role_name = ? WHERE id = ?`,
      roleData,
      (error, result, fields) => {
        if (error) {
          console.log("Error", error);
        }
        if (result.affectedRows > 0 ) {
          syncPermissions(
            permissions,
            userId,
            roleId,
            (syncError, syncSuccess) => {
              callback(syncError, syncSuccess, result);
            }
          );
        } else {
          if (result.affectedRows > 0) {
            success = true;
          }
          callback(error, success, result);
        }
      }
    );
  },

  //******** DELETEt ROLE *******************************
  deleteRole: (id, callback) => {
    var success = false;
    db.query(
      "SELECT COUNT(*) AS num_rows FROM role_management WHERE role_id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        if (numRows > 0) {
          callback(
            "Haujafanikiwa kufuta kwa kuwa role hii inatumiwa na role " +
              numRows,
            success,
            []
          );
          return;
        } else {
          db.query(
            `DELETE FROM roles  WHERE id = ?`,
            [id],
            (error2, deletedRole) => {
              if (error2) {
                console.log("Error", error2);
                // error2 = error2 ? "Haikuweza kufuta kuna tatizo" : "";
              }
              if (deletedRole) {
                success = true;
              }
              callback(error2, success, deletedRole);
              return;
            }
          );
        }
      }
    );
  },
  // //******** GET A LIST OF ROLES *******************************
  // getAllRoles: (offset, per_page, is_paginated, callback) => {
  //   //  console.log(is_paginated);
  //   db.query(
  //     `SELECT r.id AS id, r.role_name AS role_name, r.status_id AS status,
  //             GROUP_CONCAT(p.display_name , ',') AS permissions
  //     FROM role_management r
  //     LEFT JOIN permission_role pr ON pr.role_id = r.id
  //     LEFT JOIN permissions p ON p.id = pr.permission_id
  //     ${is_paginated ? " " : " WHERE r.status_id = 1 "}
  //     GROUP BY r.id
  //     ORDER BY r.role_name ASC
  //     ${is_paginated ? " LIMIT ?,?" : ""}
  //     `,
  //     is_paginated ? [offset, per_page] : [],
  //     (error, roles) => {
  //       db.query(
  //         "SELECT COUNT(*) AS num_rows FROM role_management",
  //         (error2, result, fields2) => {
  //           if(error2){
  //             error = error2;
  //           }
  //           callback(error, roles, result[0].num_rows);
  //         }
  //       );
  //     }
  //   );
  // },
};

const syncPermissions = (permissions , userId , roleId , callback) => {
          var success = false;
          var permissions_selected = []; //selected from user
          var default_permissions = [];   //default from system
          var permission_role = [];   //new permissions unique (user + system)
          
          db.query(`DELETE FROM permission_role WHERE role_id = ?` , 
          [roleId] , (error , result) => {
                    if(error){
                      console.log(error)
                    }else{
                      if(result.affectedRows > 0){
                        success = true;
                      }
                    }
                   db.query(`SELECT id FROM permissions WHERE is_default = 1` , (error , dResults) => {
                     // from user input convert to number
                     permissions.forEach((permission) => {
                          permissions_selected.push(Number(permission));
                     });
                     // form db default permissions
                     if (dResults.length > 0) {
                       dResults.forEach((d) => {
                           default_permissions.push(d.id);
                       });
                     }
                     // unique permissions (user + system);
                        uniqueArray(mergeArray(permissions_selected , default_permissions)).forEach( (permissionId) => {
                            permission_role.push([roleId, Number(permissionId) , 1 , formatDate(new Date()) , userId]);
                        });
                    
                      if(permission_role.length > 0){
                        db.query(
                          `INSERT INTO permission_role (role_id , permission_id , status_id , created_at, created_by) VALUES ?`,
                          [permission_role],
                          (error, result2) => {
                            if (error) {
                              console.log("Sync permissions: ", error);
                            }
                            if (result2.affectedRows > 0) {
                              success = true;
                            }else{
                              success = false;
                            }
                            callback(error, success);
                            return;
                          }
                        );
                      }else{
                        console.log("hi" , success);
                        callback(error, true);
                        return;
                      }
                   });
          })
}



