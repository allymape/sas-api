const db = require("../dbConnection");
module.exports = {
  //******** GET A LIST OF REGIONS *******************************
  getAllRegions: (offset, per_page, is_paginated, zone_id, callback) => {
 
    db.query(
      `SELECT r.id AS regionId, RegionCode AS regionCode, RegionName AS regionName, 
              IFNULL(zone_name , '') AS zoneName , IFNULL(r.zone_id , '') AS zoneCode, 
              r.created_at AS createdAt , 
              r.updated_at AS updatedAt 
      FROM regions r 
      LEFT JOIN zones z ON z.id=r.zone_id 
      ${(is_paginated && zone_id == null) || (!is_paginated && zone_id == undefined)  ? '' : ' WHERE r.zone_id = ? '}
      ORDER BY RegionName ASC ${is_paginated ? ' LIMIT ? , ?' : ''}`,
      is_paginated ? [offset, per_page] : (zone_id == null || zone_id == undefined ? [] : [zone_id]),
      (error, regions) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM regions",
           (error2, result2) => {
             if(error2){
              error = error2;
              console.log(error)
             }
             console.log(regions)
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
     db.query(`UPDATE regions SET zone_id = ? WHERE RegionCode = ?`,
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


