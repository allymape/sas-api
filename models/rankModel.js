const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF RANKS *******************************
  getAllRanks: (offset, per_page, is_paginated, callback) => {
    //  console.log(is_paginated);
    db.query(
      `SELECT * FROM vyeo  ${is_paginated ? ' ' : ' WHERE status_id = 1 '} ORDER BY rank_name ASC ${
        is_paginated ? " LIMIT ?,?" : ""
      }`,
      is_paginated ? [offset, per_page] : [],
      (error, ranks, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM vyeo",
          (error2, result, fields2) => {
            callback(error, ranks, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE RANK *******************************
  storeRole: (rankData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO ranks (rank_name , display_name , status_id, created_at , created_by) VALUES ?`,
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
  findRole: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , rank_name , display_name , status_id FROM ranks WHERE id = ?`,
      [id],
      (error, rank) => {
        if (error) {
          console.log("Error", err);
        }
        if (rank) {
          success = true;
        }
        callback(error, success, rank);
      }
    );
  },

  //******** UPDATE RANK *******************************
  updateRole: (name, display, status, id, callback) => {
    var success = false;
    db.query(
      `UPDATE  ranks SET rank_name = ? , display_name = ? , status_id = ?  WHERE id = ?`,
      [name, display, status, id],
      (error, rank, fields) => {
        if (error) {
          console.log("Error", error);
        }
        if (rank) {
          success = true;
        }
        callback(error, success, rank);
      }
    );
  },

  //******** DELETEt RANK *******************************
  deleteRole: (id, callback) => {
    var success = false;
    db.query(
      "SELECT COUNT(*) AS num_rows FROM rank_rank WHERE rank_id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        if (numRows > 0) {
          callback(
            "Haujafanikiwa kufuta kwa kuwa rank hii inatumiwa na rank " +
              numRows,
            success,
            []
          );
          return;
        } else {
          db.query(
            `DELETE FROM ranks  WHERE id = ?`,
            [id],
            (error2, deletedRole) => {
              if (error2) {
                console.log("Error", error2);
                error2 = error2 ? "Haikuweza kufuta kuna tatizo" : "";
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
};
