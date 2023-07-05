const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF streets *******************************
  getAllStreets: (offset, per_page, callback) => {
    db.query(
      "SELECT StreetCode, StreetName, WardName, LgaName, RegionName, streets.created_at AS CreatedAt , streets.updated_at AS UpdatedAt FROM streets, " +
      " wards,districts,regions WHERE wards.WardCode = streets.WardCode AND wards.LgaCode = districts.LgaCode AND districts.RegionCode = regions.RegionCode ORDER BY RegionName ASC , LgaName ASC , WardName ASC, StreetName ASC LIMIT ?,?",
        [offset, per_page],
      (error, streets, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM streets",
          (error2, result, fields2) => {
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
