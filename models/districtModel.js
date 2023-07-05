const db = require("../dbConnection");
module.exports = {
  //******** GET A LIST OF DISTRICTS *******************************
  getAllDistricts: (offset, per_page, is_paginated , region_code, callback) => {

    db.query(
      `SELECT regions.id AS reg_id, regions.RegionName AS regionName,districts.LgaName AS LgaName, districts.LgaCode AS LgaCode , districts.created_at AS createdAt , districts.updated_at AS updatedAt 
      FROM districts, regions 
      WHERE districts.RegionCode = regions.RegionCode ${is_paginated ? '' : 'AND districts.RegionCode = ? ' }
      ORDER BY RegionName ASC 
      ${is_paginated ? ' LIMIT ? , ?' : ''
      }`,
        is_paginated ? [offset, per_page] : [region_code],
      (error, districts, fields) => {
        if(error){
          console.log(error)
        }
        db.query(
          "SELECT COUNT(*) AS num_rows FROM districts",
          (error2, result, fields2) => {
            callback(error, districts, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE DISTRICTS *******************************
  storeDistricts: (districtData, callback) => {
    db.query(
      `INSERT INTO districts (id,LgaCode, LgaName, RegionCode , created_at , updated_at) VALUES ? ON DUPLICATE KEY UPDATE LgaCode = VALUES(LgaCode), LgaName = VALUES(LgaName), RegionCode = VALUES(RegionCode), updated_at = VALUES(updated_at)`,
      [districtData],
      (err, result) => {
            if (err) {
                console.log(err);
            }
            var success = false;
            if (result) {
                success = true;
            }
            callback(success);
      }
    );
  },
};