const db = require("../config/database");

module.exports = {
  //******** GET A LIST OF ZONES *******************************
  getAllZones: (offset, per_page, search_value, callback) => {
    var searchQuery = "";
    var queryParams = [];
    if (search_value) {
      searchQuery += ` AND (zone_name LIKE ? )`;
      queryParams.push(
        `%${search_value}%`
      );
    }
    let sql = ` FROM zones
                WHERE 1 = 1 
                ${searchQuery}
                ORDER BY zone_name ASC  `;

    db.query(
      ` SELECT *   
        ${sql}
        ${per_page > 0 ? "LIMIT ? , ?" : ""}`,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, zones) => {
        db.query(
          `SELECT COUNT(*) AS num_rows  ${sql}`,
          queryParams,
          (error2, result2) => {
            if (error2) {
              error = error2;
              console.log(error);
            }
            // console.log(regions);
            callback(error, zones, result2[0].num_rows);
          }
        );
      });
  },
  lookupZones: (user , callback) => {
    //  console.log(is_paginated);
    db.query(
      `SELECT * FROM zones  
        WHERE status_id = 1 
        ${
          ["kanda", "wilaya"].includes(user.ngazi)
            ? 'AND zones.id = ' + user.zone_id
            : ""
        }
        ORDER BY zone_name ASC`,
      (error, zones) => {
        if (error) console.log(error);
        callback(error, zones);
      }
    );
  },
  //******** STORE ZONE *******************************
  storeZone: (zoneData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO zones (zone_name , zone_code , status_id, created_at) VALUES ?`,
      [zoneData],
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
  //******** FIND ZONE *******************************
  findZone: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , zone_name , display_name , status_id FROM zones WHERE id = ?`,
      [id],
      (error, zone) => {
        if (error) {
          console.log("Error", err);
        }
        if (zone) {
          success = true;
        }
        callback(error, success, zone);
      }
    );
  },

  //******** UPDATE ZONE *******************************
  updateZone: (zoneData, callback) => {
    var success = false;
    db.query(
      `UPDATE zones 
       SET zone_name = ?, zone_code = ?, box = ?, status_id = ?, updated_at = ?
       WHERE id = ?`,
      zoneData,
      (error, zone, fields) => {
        if (error) {
          console.log("Error", error);
        }
        if (zone) {
          success = true;
        }
        callback(error, success, zone);
      }
    );
  },

  //******** DELETE ZONE *******************************
  deleteZone: (id, callback) => {
    var success = false;
    db.query(
      `SELECT COUNT(*) AS num_rows 
       FROM regions r 
       WHERE r.zone_id = ?`,
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        // console.log(numRows , id);
        if (numRows > 0) {
          callback(error, success, null);
        } else {
          db.query(
            `UPDATE zones SET status_id = 0  WHERE id = ?`,
            [id],
            (error2, deletedZone) => {
              if (error2) {
                console.log(error2);
                error = error2;
              }
              if (deletedZone.affectedRows > 0) {
                success = true;
              }
              callback(error, success, deletedZone);
            }
          );
        }
      }
    );
  },
};
