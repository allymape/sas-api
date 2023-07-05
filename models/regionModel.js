const db = require("../dbConnection");
module.exports = {
  //******** GET A LIST OF REGIONS *******************************
  getAllRegions: (offset, per_page, is_paginated, zone_id, callback) => {
    console.log(zone_id)
    db.query(
      `SELECT regions.id AS regionId, RegionCode AS regionCode, RegionName AS regionName, 
              IFNULL(zone_name , '') AS zoneName , IFNULL(regions.zone_code , '') AS zoneCode, regions.created_at AS createdAt , 
              regions.updated_at AS updatedAt 
      FROM regions LEFT JOIN zones ON zones.id=regions.zone_code 
      ${is_paginated && zone_id == null ? '' : ' WHERE regions.zone_code = ? '}
      ORDER BY RegionName ASC ${is_paginated ? ' LIMIT ? , ?' : ''}`,
      is_paginated ? [offset, per_page] : [zone_id],
      (error, regions, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM regions",
           (error2, result2, fields2) => {
            callback(error, regions, result2[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE REGIONS *******************************
  storeRegions: (regionData , callback) => {
     db.query(`INSERT INTO regions (id, RegionCode, RegionName , created_at, updated_at) VALUES ? ON DUPLICATE KEY UPDATE RegionCode = VALUES(RegionCode), RegionName = VALUES(RegionName), updated_at = VALUES(updated_at)`,
       [regionData],
       (err, result) => {
         if (err) {
           console.log(err);
         }
         var success = false;
         if (result) {
           //  console.log("Regions data created successfully");
           success = true;
         }
         callback(success)
       }
     );
  },
  //******** UPDATE REGION ZONE *******************************
  updateRegionZone: (regionId , zoneCode , callback) => {
     db.query(`UPDATE regions SET zone_code = ? WHERE RegionCode = ?`,
     [zoneCode , regionId],
       (err, result) => {
         if (err) {
           console.log(err);
         }
         var success = false;
         if (result) {
           success = true;
         }
         callback(err, success, result);
       }
     );
  }
};


