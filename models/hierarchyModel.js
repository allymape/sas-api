const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF Hierarchies *******************************
  getAllHierarchies: (offset, per_page, is_paginated, rank_id, callback) => {
    
    const hierarchiesQuery = `SELECT v.id AS id,
      v.rank_name as name, r.name as rank_name, v.status_id AS status, v.rank_level AS rank_level
      FROM vyeo v
      LEFT JOIN ranks r ON v.rank_level = r.id 
      ${is_paginated ? "" : " WHERE v.status_id = 1"} ${ is_paginated ? '' : ' AND v.rank_level = ? '}
      ORDER BY r.id ASC
      ${is_paginated ? " LIMIT ?,?" : ""}`;
    db.query(
      hierarchiesQuery,
      is_paginated ? [offset, per_page] : [Number(rank_id)],
      (error, hierarchies, fields) => {
        if (error) {
          console.log(error);
        }
        db.query(
          `SELECT id, name 
          FROM ranks r where status_id = 1`,
          (error2, ranks) => {
            if (error2) {
              error = error2;
              console.log(error2);
            }
            db.query(
              "SELECT COUNT(*) AS num_rows FROM vyeo",
              (error3, result, fields2) => {
                if (error3) {
                  error = error3;
                }
                callback(error, hierarchies, ranks, result[0].num_rows);
              }
            );
          }
        );
      }
    );
  },
  //******** STORE Hierarchy *******************************
  storeHierarchy: (HierarchyData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO vyeo (rank_name  , rank_level , status_id) VALUES ?`,
      [HierarchyData],
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
  //******** FIND Hierarchy *******************************
  findHierarchy: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , Hierarchy_name , display_name , status_id FROM Hierarchies WHERE id = ?`,
      [id],
      (error, Hierarchy) => {
        if (error) {
          console.log("Error", err);
        }
        if (Hierarchy) {
          success = true;
        }
        callback(error, success, Hierarchy);
      }
    );
  },

  //******** UPDATE Hierarchy *******************************
  updateHierarchy: (hierarchyData, callback) => {
    var success = false;
    db.query(
      `UPDATE  vyeo SET rank_name = ? , rank_level = ? , status_id = ?  WHERE id = ?`,
      hierarchyData,
      (error, hierarchy, fields) => {
        if (error) {
          console.log("Error", error);
        }
        if (hierarchy) {
          success = true;
        }
        callback(error, success, hierarchy);
      }
    );
  },

  //******** DELETEt Hierarchy *******************************
  deleteHierarchy: (id, callback) => {
    var success = false;
    db.query(
      "SELECT COUNT(*) AS num_rows FROM Hierarchy_Hierarchy WHERE Hierarchy_id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        if (numRows > 0) {
          callback(
            "Haujafanikiwa kufuta kwa kuwa Hierarchy hii inatumiwa na Hierarchy " +
              numRows,
            success,
            []
          );
          return;
        } else {
          db.query(
            `DELETE FROM Hierarchies  WHERE id = ?`,
            [id],
            (error2, deletedHierarchy) => {
              if (error2) {
                console.log("Error", error2);
                error2 = error2 ? "Haikuweza kufuta kuna tatizo" : "";
              }
              if (deletedHierarchy) {
                success = true;
              }
              callback(error2, success, deletedHierarchy);
              return;
            }
          );
        }
      }
    );
  },
};
