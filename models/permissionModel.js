const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF PERMISSIONS *******************************
  getAllPermission: (offset, per_page, is_paginated, callback , status = false) => {
    db.query(
      `SELECT * FROM permissions 
      ${status ? " WHERE status_id = " + status : ""}
      ORDER BY permission_name ASC 
      ${is_paginated ? "LIMIT ?,?" : ""} `,
      is_paginated ? [offset, per_page] : [],
      (error, permissions, fields) => {
        db.query(
          `SELECT COUNT(*) AS num_rows 
          FROM permissions
          ${status ? " WHERE status_id = " + status : ""}
          `,
          (error2, result, fields2) => {
            callback(error, permissions, result[0].num_rows);
          }
        );
      }
    );
  },
   syncPermissions : (permissions , callback)=>{
    try {
       var success = false;
       db.query(
         `INSERT INTO permissions (id , permission_name , display_name , status_id, created_at , created_by) 
          VALUES ? ON DUPLICATE KEY 
          UPDATE permission_name = VALUES(permission_name) , display_name = VALUES(display_name) , created_at = VALUES(created_at) , created_by = VALUES(created_by) `,
         [permissions],
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
    } catch (error) {
      callback(error , false , []);
    }
  },
  //******** STORE PERMISSION *******************************
  storePermission: (permissionData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO permissions (permission_name , display_name , status_id, created_at , created_by) VALUES ?`,
      [permissionData],
      (error, result) => {
        if (error) {
          console.log("Error", error);
        }
        if (result) {
          success = true;
        }
        callback(error, success, result);
      }
    );
  },
  //******** FIND PERMISSION *******************************
  findPermission: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , permission_name , display_name , status_id, is_default
      FROM permissions 
      WHERE id = ?`,
      [id],
      (error, permission) => {
        if (error) {
          console.log("Error", err);
        }
        if (permission) {
          success = true;
        }
        callback(error, success, permission);
      }
    );
  },

  //******** UPDATE PERMISSION *******************************
  updatePermission: (name, display, status, is_default, id, callback) => {
    var success = false;
    db.query(
      `UPDATE  permissions SET permission_name = ? , display_name = ? , status_id = ? , is_default = ?  WHERE id = ?`,
      [name, display, status, is_default, id],
      (error, permission, fields) => {
        if (error) {
          console.log("Error", error);
        }
        if (permission) {
          success = true;
        }
        callback(error, success, permission);
      }
    );
  },

  //******** DELETEt PERMISSION *******************************
  deletePermission: (id, callback) => {
    var success = false;
    db.query(
      "SELECT COUNT(*) AS num_rows FROM permission_role WHERE permission_id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        if (numRows > 0) {
          callback(
            "Haujafanikiwa kufuta kwa kuwa permission hii inatumiwa na role " +
              numRows,
            success,
            []
          );
          return;
        } else {
          db.query(
            `DELETE FROM permissions  WHERE id = ?`,
            [id],
            (error2, deletedPermission) => {
              if (error2) {
                console.log("Error", error2);
                error2 = error2 ? "Haikuweza kufuta kuna tatizo" : "";
              }
              if (deletedPermission) {
                success = true;
              }
              callback(error2, success, deletedPermission);
              return;
            }
          );
        }
      }
    );
  },
};
