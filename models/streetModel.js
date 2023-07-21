const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF streets *******************************
  getAllStreets: (offset, per_page, is_paginated , ward_code, callback) => {
    db.query(
      `SELECT StreetCode, StreetName, WardName, LgaName, RegionName, s.created_at AS CreatedAt , s.updated_at AS UpdatedAt 
      FROM streets s
      JOIN wards w  ON w.WardCode = s.WardCode
      JOIN districts d ON w.LgaCode = d.LgaCode
      JOIN regions r ON d.RegionCode = r.RegionCode
      ${is_paginated ? "" : "WHERE s.WardCode = ?"} 
      ORDER BY RegionName ASC , LgaName ASC , WardName ASC, StreetName ASC 
      ${is_paginated ? "LIMIT ?,?" : ""}`,
      is_paginated ? [offset, per_page] : [ward_code],
      (error, streets) => {
        if (error) {
          console.log(error);
        }
        db.query(
          `SELECT COUNT(*) AS num_rows FROM streets s ${
            is_paginated ? "" : "WHERE s.WardCode = ?"
          }`,
          is_paginated ? [] : [ward_code],
          (error2, result) => {
            if (error2) {
              error = error2;
              console.log(error2);
            }
            callback(error, streets, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE streets *******************************
  storeStreets: (streetData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO streets (id, StreetCode, StreetName, WardCode , created_at , updated_at) VALUES ? ON DUPLICATE KEY UPDATE StreetCode = VALUES(StreetCode), StreetName = VALUES(StreetName), WardCode = VALUES(WardCode), updated_at = VALUES(updated_at)`,
      [streetData],
      (err, result) => {
        if (err) {
          console.log("Error", err);
        }
        if (result.affectedRows > 0) {
          success = true;
        }
        callback(success);
      }
    );
  },
};
