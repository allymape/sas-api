const db = require("../config/database");

module.exports = {
  //******** GET A LIST OF BIAS *******************************
  getAllBiases: (offset, per_page, is_paginated, callback) => {
    //  console.log(is_paginated);
    db.query(
      `SELECT * 
      FROM school_specializations
        ${is_paginated ? " " : " WHERE status_id = 1 "} 
        ${is_paginated ? " LIMIT ?,?" : ""}`,
      is_paginated ? [offset, per_page] : [],
      (error, combinations, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM school_specializations",
          (error2, result, fields2) => {
            // console.log('ranks' , is_paginated);
            callback(error, combinations, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE BIAS *******************************
  storeBias: (formData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO school_specializations  (specialization , status_id , created_at , updated_at) VALUES ?`,
      [formData],
      (error, result) => {
        if (error) {
          console.log("Error", error);
        }
        if (result.affectedRows > 0) {
          success = true;
        }
        callback(error, success, result);
      }
    );
  },
  //******** FIND BIAS *******************************
  findBias: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , name  , status_id FROM ranks WHERE id = ?`,
      [id],
      (error, role) => {
        if (error) {
          console.log("Error", err);
        }
        if (role) {
          success = true;
        }
        callback(error, success, role);
      }
    );
  },

  //******** UPDATE BIAS *******************************
  updateBias: (formData, callback) => {
    var success = false;
    db.query(
      `UPDATE  school_specializations SET specialization = ?   WHERE id = ?`,
      formData,
      (error, results) => {
        if (error) {
          console.log("Error", error);
        }
        if (results.affectedRows > 0) {
          success = true;
        }
        callback(error, success, results);
      }
    );
  },

  //******** DELETE BIAS *******************************
  deleteRestoreBias: (id, callback) => {
    var success = false;
    db.query(
      `SELECT status_id  
       FROM school_specializations
       WHERE id = ?`,
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        if (result.length == 0) {
          callback(false);
        } else {
          var status_id = result[0].status_id;
          db.query(
            `UPDATE school_specializations SET status_id = ${status_id == 1 ? 0 : 1}  WHERE id = ?`,
            [id],
            (error2, deletedBias) => {
              if (error2) {
                console.log(error2);
                error = error2;
              }
              if (deletedBias.affectedRows > 0) {
                success = true;
              }
              callback(success);
            }
          );
        }
      }
    );
  },
};
