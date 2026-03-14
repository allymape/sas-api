const db = require("../config/database");

module.exports = {
  //******** GET A LIST OF RANKS *******************************
  getAllRanks: (offset, per_page, is_paginated, callback) => {
    //  console.log(is_paginated);
    db.query(
      `SELECT * 
        FROM ranks  
        ${is_paginated ? " " : " WHERE status_id = 1 "} 
        ORDER BY id ASC ${is_paginated ? " LIMIT ?,?" : ""}`,
      is_paginated ? [offset, per_page] : [],
      (error, ranks, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM ranks",
          (error2, result, fields2) => {
            // console.log('ranks' , is_paginated);
            callback(error, ranks, result[0].num_rows);
          }
        );
      }
    );
  },
  lookupRanks: (user , callback) => {
    // console.log(user)
    db.query(
      `SELECT * 
        FROM ranks  
        ${
          ["kanda", "wilaya"].includes(user.ngazi)
            ? 'WHERE name = "' + user.ngazi + '"'
            : ""
        }
        ORDER BY id ASC `,

      (error, ranks) => {
        if (error) console.log(error);
        callback(error, ranks);
      }
    );
  },
  //******** STORE RANK *******************************
  storeRank: (rankData, callback) => {
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
  //******** FIND RANK *******************************
  findRank: (id, callback) => {
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

  //******** UPDATE RANK *******************************
  updateRank: (rankData, callback) => {
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

  //******** DELETE RANK *******************************
  deleteRank: (id, callback) => {
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
            (error2, deletedRank) => {
              if (error2) {
                console.log(error2);
                error = error2;
              }
              if (deletedRank.affectedRows > 0) {
                success = true;
              }
              callback(error, success, deletedRank);
            }
          );
        }
      }
    );
  },
};
