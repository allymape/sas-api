const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF REGISTRATION TYPES *******************************
  getAllRegistrationTypes: (offset, per_page, is_paginated, callback) => {
    db.query(
      `SELECT id, registry AS name 
       FROM registry_types  
       ${is_paginated ? "" : ""} 
       ${is_paginated ? " LIMIT ?,?" : ""}`,
       is_paginated ? [offset, per_page] : [],
      (error, registrationTypes, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM registry_types",
          (error2, result, fields2) => {
            callback(error, registrationTypes, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE REGISTRATION TYPE *******************************
  storeRegistrationType: (RegistrationTypeData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO RegistrationType (RegistrationType_name , display_name , status_id, created_at , created_by) VALUES ?`,
      [RegistrationTypeData],
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
  //******** FIND REGISTRATION TYPE *******************************
  findRegistrationType: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , RegistrationType_name , display_name , status_id FROM RegistrationType WHERE id = ?`,
      [id],
      (error, RegistrationType) => {
        if (error) {
          console.log("Error", err);
        }
        if (RegistrationType) {
          success = true;
        }
        callback(error, success, RegistrationType);
      }
    );
  },

  //******** UPDATE REGISTRATION TYPE *******************************
  updateRegistrationType: (name, display, status, id, callback) => {
    var success = false;
    db.query(
      `UPDATE  RegistrationType SET RegistrationType_name = ? , display_name = ? , status_id = ?  WHERE id = ?`,
      [name, display, status, id],
      (error, RegistrationType, fields) => {
        if (error) {
          console.log("Error", error);
        }
        if (RegistrationType) {
          success = true;
        }
        callback(error, success, RegistrationType);
      }
    );
  },

  //******** DELETE REGISTRATION TYPE *******************************
  deleteRegistrationType: (id, callback) => {
    var success = false;
    db.query(
      "SELECT COUNT(*) AS num_rows FROM RegistrationType_role WHERE RegistrationType_id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        if (numRows > 0) {
          callback(
            "Haujafanikiwa kufuta kwa kuwa RegistrationType hii inatumiwa na role " +
              numRows,
            success,
            []
          );
          return;
        } else {
          db.query(
            `DELETE FROM RegistrationType  WHERE id = ?`,
            [id],
            (error2, deletedRegistrationType) => {
              if (error2) {
                console.log("Error", error2);
                error2 = error2 ? "Haikuweza kufuta kuna tatizo" : "";
              }
              if (deletedRegistrationType) {
                success = true;
              }
              callback(error2, success, deletedRegistrationType);
              return;
            }
          );
        }
      }
    );
  },
};
