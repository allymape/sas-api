const db = require("../config/database");

module.exports = {
  //******** GET A LIST OF Hierarchies *******************************
  getAllHierarchies: (offset, per_page, is_paginated, rank_id, callback) => {
    const whereClauses = [];
    const queryParams = [];

    if (!is_paginated) {
      whereClauses.push("v.status_id = 1");
    }

    if (rank_id) {
      whereClauses.push("v.rank_level = ?");
      queryParams.push(Number(rank_id));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const hierarchiesQuery = `SELECT v.id AS id,
      v.rank_name as name, 
      v.rank_name AS unit_name,
      r.name as rank_name, 
      v.status_id AS status, 
      v.rank_level AS rank_level,
      v.overdue AS overdue
      FROM vyeo v
      LEFT JOIN ranks r ON v.rank_level = r.id 
      ${whereSql}
      ORDER BY r.id ASC
      ${is_paginated ? " LIMIT ?,?" : ""}`;
    db.query(
      hierarchiesQuery,
      is_paginated ? queryParams.concat([offset, per_page]) : queryParams,
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
              `SELECT COUNT(*) AS num_rows FROM vyeo v ${whereSql}`,
              queryParams,
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
  lookupHierarchies: (rank_id , user, callback) => {
    if (!rank_id) {
      callback(null, []);
      return;
    }
    db.query(
      `SELECT v.id AS id,
        v.rank_name as name, v.rank_name AS unit_name, r.name as rank_name, v.status_id AS status, v.rank_level AS rank_level
        FROM vyeo v
        LEFT JOIN ranks r ON v.rank_level = r.id  
        WHERE  v.rank_level = ? AND v.status_id = 1 AND  r.status_id = 1
        ${
          ["kanda", "wilaya"].includes(user.ngazi)
            ? 'AND LOWER(v.rank_name) = "' + user.sehemu + '"'
            : ""
        }
        ORDER BY r.id ASC`,
      [Number(rank_id)],
      (error, result) => {
        if (error) {
          console.log("Error", error);
        }
        callback(error, result);
      }
    );
  },
  //******** STORE Hierarchy *******************************
  storeHierarchy: (HierarchyData, callback) => {
    var success = false;
    const normalizedRows = (Array.isArray(HierarchyData) ? HierarchyData : [])
      .map((row) => {
        if (!Array.isArray(row)) return null;
        return [
          row[0] || null, // rank_name
          row[2] || null, // rank_level
          row[3] || 0, // overdue
          typeof row[4] === "undefined" ? 1 : row[4], // status_id
        ];
      })
      .filter(Boolean);

    if (normalizedRows.length === 0) {
      callback(new Error("Invalid hierarchy payload"), success, null);
      return;
    }

    db.query(
      `INSERT INTO vyeo (rank_name, rank_level, overdue, status_id) VALUES ?`,
      [normalizedRows],
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
      `SELECT id, rank_name AS name, rank_name AS unit_name, rank_level, overdue, status_id AS status
       FROM vyeo
       WHERE id = ?`,
      [id],
      (error, hierarchy) => {
        if (error) {
          console.log("Error", error);
        }
        if (hierarchy && hierarchy.length > 0) {
          success = true;
        }
        callback(error, success, hierarchy);
      }
    );
  },

  //******** UPDATE Hierarchy *******************************
  updateHierarchy: (hierarchyData, callback) => {
    var success = false;
    const normalized = [
      hierarchyData?.[0] || null, // rank_name
      hierarchyData?.[2] || null, // rank_level
      hierarchyData?.[3] || 0, // overdue
      hierarchyData?.[4] ? 1 : 0, // status
      hierarchyData?.[5] || 0, // id
    ];

    db.query(
      `UPDATE  vyeo SET rank_name = ?, rank_level = ?, overdue = ?, status_id = ? WHERE id = ?`,
      normalized,
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
      "SELECT COUNT(*) AS num_rows FROM roles WHERE vyeoId = ?",
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        if (numRows > 0) {
          callback(
            "Haujafanikiwa kufuta kwa kuwa ngazi hii inatumiwa na vyeo " +
              numRows,
            success,
            []
          );
          return;
        } else {
          db.query(
            `DELETE FROM vyeo WHERE id = ?`,
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
