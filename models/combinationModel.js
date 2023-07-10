const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF COMBINATIONS *******************************
  getAllCombinations: (offset, per_page, is_paginated, callback) => {
    //  console.log(is_paginated);
    db.query(
      `SELECT specialization, combination, c.id as comb_id 
      FROM combinations c 
      JOIN school_specializations s ON s.id = c.school_specialization_id
        ${is_paginated ? " " : " WHERE c.status_id = 1 "} 
        ${is_paginated ? " LIMIT ?,?" : ""}`,
      is_paginated ? [offset, per_page] : [],
      (error, biases, fields) => {
        if(error){
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
  storeCombination: (rankData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO ranks (name , created_at , updated_at) VALUES ?`,
      [rankData],
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
  updateCombination: (rankData, callback) => {
    var success = false;
    db.query(
      `UPDATE  ranks SET name = ?  , status_id = ?  WHERE id = ?`,
      rankData,
      (error, role, fields) => {
        if (error) {
          console.log("Error", error);
        }
        if (role) {
          success = true;
        }
        callback(error, success, role);
      }
    );
  },

  //******** DELETE COMBINATION *******************************
  deleteCombination: (id, callback) => {
    var success = false;
    db.query(
      `SELECT COUNT(*) AS num_rows 
       FROM vyeo v 
       WHERE v.rank_level = ?`,
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        console.log(numRows, id);
        if (numRows > 0) {
          callback(error, success, null);
        } else {
          db.query(
            `UPDATE ranks SET status_id = 0  WHERE id = ?`,
            [id],
            (error2, deletedCombination) => {
              if (error2) {
                console.log(error2);
                error = error2;
              }
              if (deletedCombination.affectedRows > 0) {
                success = true;
              }
              callback(error, success, deletedCombination);
            }
          );
        }
      }
    );
  },
};
