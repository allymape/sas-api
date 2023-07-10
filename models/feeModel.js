const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF RANKS *******************************
  getAllFees: (offset, per_page, is_paginated, callback) => {
    //  console.log(is_paginated);
    db.query(
      `SELECT * 
        FROM fees  
        ${is_paginated ? ' ' : ' WHERE status_id = 1 '} 
        ORDER BY id ASC ${
        is_paginated ? " LIMIT ?,?" : ""
      }`,
      is_paginated ? [offset, per_page] : [],
      (error, fees, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM fees",
          (error2, result, fields2) => {
            // console.log('fees' , is_paginated);
            callback(error, fees, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE RANK *******************************
  storeFee: (rankData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO fees (name , created_at , updated_at) VALUES ?`,
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
  //******** FIND RANK *******************************
  findFee: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , name  , status_id FROM fees WHERE id = ?`,
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

  //******** UPDATE RANK *******************************
  updateFee: (rankData, callback) => {
    var success = false;
    db.query(
      `UPDATE  fees SET name = ?  , status_id = ?  WHERE id = ?`,
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

  //******** DELETE RANK *******************************
  deleteFee: (id, callback) => {
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
        console.log(numRows , id);
        if (numRows > 0) {
          callback(error, success, null);
        } else {
          db.query(
            `UPDATE fees SET status_id = 0  WHERE id = ?`,
            [id],
            (error2, deletedFee) => {
              if (error2) {
                console.log(error2);
                error = error2 
              }
              if (deletedFee.affectedRows > 0) {
                success = true;
              }
              callback(error, success, deletedFee);
            }
          );
        }
      }
    );
  },
};
