const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF ZONES *******************************
  getAllZones: (offset, per_page, is_paginated, callback) => {
    //  console.log(is_paginated);
    db.query(
      `SELECT * FROM zones  ${is_paginated ? ' ' : ' WHERE status_id = 1 '} ORDER BY zone_name ASC ${
        is_paginated ? " LIMIT ?,?" : ""
      }`,
      is_paginated ? [offset, per_page] : [],
      (error, zones, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM zones",
          (error2, result, fields2) => {
            callback(error, zones, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE ZONE *******************************
  storeZone: (zoneData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO zones (zone_name , display_name , status_id, created_at , created_by) VALUES ?`,
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
  updateZone: (name, display, status, id, callback) => {
    var success = false;
    db.query(
      `UPDATE  zones SET zone_name = ? , display_name = ? , status_id = ?  WHERE id = ?`,
      [name, display, status, id],
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

  //******** DELETEt ZONE *******************************
  deleteZone: (id, callback) => {
    var success = false;
    db.query(
      "SELECT COUNT(*) AS num_rows FROM zone_zone WHERE zone_id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        if (numRows > 0) {
          callback(
            "Haujafanikiwa kufuta kwa kuwa zone hii inatumiwa na zone " +
              numRows,
            success,
            []
          );
          return;
        } else {
          db.query(
            `DELETE FROM zones  WHERE id = ?`,
            [id],
            (error2, deletedZone) => {
              if (error2) {
                console.log("Error", error2);
                error2 = error2 ? "Haikuweza kufuta kuna tatizo" : "";
              }
              if (deletedZone) {
                success = true;
              }
              callback(error2, success, deletedZone);
              return;
            }
          );
        }
      }
    );
  },
};
