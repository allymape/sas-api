const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF PERMISSIONS *******************************
  getAllPermission: (offset, per_page, callback) => {
    db.query(
      "SELECT * FROM permissions ORDER BY permission_name ASC LIMIT ?,?",
      [offset, per_page],
      (error, permissions, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM permissions",
          (error2, result, fields2) => {
            callback(error, permissions, result[0].num_rows);
          }
        );
      }
    );
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
      `SELECT id , permission_name , display_name , status_id FROM permissions WHERE id = ?`,
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
  updatePermission: (name, display, status, id, callback) => {
    var success = false;
    db.query(
      `UPDATE  permissions SET permission_name = ? , display_name = ? , status_id = ?  WHERE id = ?`,
      [name, display, status, id],
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
    db.query('SELECT COUNT(*) AS num_rows FROM permission_role WHERE permission_id = ?' , 
    [id],
    (error , result) => {
        if(error){
            console.log(error);
        }
        var numRows = result[0].num_rows;
        if(numRows > 0){
            callback('Haujafanikiwa kufuta kwa kuwa permission hii inatumiwa na role '+numRows, success, []);
            return;
        }else{
             db.query(`DELETE FROM permissions  WHERE id = ?`,[id], (error2, deletedPermission) => {
                 if (error2) {
                   console.log("Error", error2);
                   error2 = error2 ? "Haikuweza kufuta kuna tatizo" : '';
                 }
                 if (deletedPermission) {
                   success = true;
                 }
                 callback( error2, success, deletedPermission);
                 return;
               }
             );
        }
    });
  },
};
