const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF WARDS *******************************
  getAllWards: (offset, per_page, callback) => {
    db.query(
      "SELECT WardCode, WardName AS wardName, LgaName, RegionName , wards.created_at AS CreatedAt , wards.updated_at AS UpdatedAt FROM wards, " +
      " districts, regions WHERE districts.LgaCode = wards.LgaCode AND regions.RegionCode = districts.RegionCode  ORDER BY RegionName ASC, LgaName  ASC LIMIT ?, ?",
        [offset, per_page],
      (error, wards, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM wards",
          (error2, result, fields2) => {
            callback(error, wards, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE WARDS *******************************
  storeWards: (wardData, callback) => {
    var success = false;
        db.query(
          `INSERT INTO wards (id, WardCode, WardName, LgaCode , created_at , updated_at) VALUES ? ON DUPLICATE KEY UPDATE WardCode = VALUES(WardCode), WardName = VALUES(WardName), LgaCode = VALUES(LgaCode), updated_at = VALUES(updated_at)`,
              [wardData],
              (err, result) => {
                if (err) {
                  console.log("Error",err);
                }
                if (result) {
                   success = true;
                }
                callback(success);
              }
            );
      },
};


