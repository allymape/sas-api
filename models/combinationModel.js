const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF COMBINATIONS *******************************
  getAllCombinations: (offset, per_page, is_paginated, callback) => {
    //  console.log(is_paginated);
    db.query(
      `SELECT specialization, school_specialization_id, combination, c.id as comb_id, c.status_id AS status_id 
      FROM combinations c 
      JOIN school_specializations s ON s.id = c.school_specialization_id
        ${is_paginated ? " " : " WHERE c.status_id = 1 "} 
        ${is_paginated ? " LIMIT ?,?" : ""}`,
      is_paginated ? [offset, per_page] : [],
      (error, biases, fields) => {
        if (error) {
          console.log(error);
        }
        db.query(
          `SELECT * from school_specializations WHERE status_id = 1`,
          function (error2, specializations) {
            if (error2) {
              error = error2;
            }
            db.query(
              "SELECT COUNT(*) AS num_rows FROM combinations",
              (error3, result, fields2) => {
                if (error3) error = error3;
                callback(error, biases, specializations, result[0].num_rows);
              }
            );
          }
        );
      }
    );
  },
  //******** STORE COMBINATION *******************************
  storeCombination: (formData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO combinations (combination, school_specialization_id , created_at , updated_at) VALUES ?`,
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
  //******** FIND COMBINATION *******************************
  findCombination: (id, callback) => {
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

  //******** UPDATE COMBINATION *******************************
  updateCombination: (formData, callback) => {
    var success = false;
    db.query(
      `UPDATE  combinations SET combination = ? , school_specialization_id = ?   WHERE id = ?`,
      formData,
      (error, combination) => {
        if (error) {
          console.log("Error", error);
        }
        if (combination.affectedRows > 0) {
          success = true;
        }
        callback(error, success, combination);
      }
    );
  },

  //******** DELETE COMBINATION *******************************
  deleteRestoreCombination: (id, callback) => {
    var success = false;
    db.query(
      `SELECT  status_id 
       FROM combinations 
       WHERE id = ?`,
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
       
        if (result.length == 0) {
          callback(true, false, null);
        } else {
           var status_id = result[0].status_id;
          db.query(
            `UPDATE combinations SET status_id = ${status_id == 1 ? 0 : 1}  WHERE id = ?`,
            [id],
            (error2, updatedCombination) => {
              if (error2) {
                console.log(error2);
                error = error2;
              }
              if (updatedCombination.affectedRows > 0) {
                success = true;
              }
              callback(error, success, updatedCombination);
            }
          );
        }
      }
    );
  },
};
