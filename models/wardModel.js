const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF WARDS *******************************
  getAllWards: (offset, per_page, is_paginated ,lga_code, callback) => {
    db.query(
      `SELECT WardCode, WardName AS WardName, LgaName, RegionName , w.created_at AS CreatedAt , w.updated_at AS UpdatedAt 
      FROM wards w
      JOIN districts d ON d.LgaCode = w.LgaCode
      JOIN regions r ON r.RegionCode = d.RegionCode  
      ${ is_paginated ? '' : ' WHERE w.LgaCode = ?'}
      ORDER BY RegionName ASC, LgaName  ASC 
      ${ is_paginated ? 'LIMIT ?, ?' : ''}`,
        is_paginated ? [offset, per_page] : [lga_code],
      (error, wards) => {
        if(error){
          console.log(error)
        }
        db.query(
          `SELECT COUNT(*) AS num_rows FROM wards ${ is_paginated ? '' : ' WHERE wards.LgaCode = ?'} ` ,
          is_paginated ? [] : [lga_code],
          (error2, result) => {
            if(error2){
              error = error2
              console.log(error2)
            }
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
          `INSERT INTO wards (id, WardCode, WardName, LgaCode , created_at , updated_at) 
          VALUES ? ON DUPLICATE KEY 
          UPDATE WardCode = VALUES(WardCode), WardName = VALUES(WardName), LgaCode = VALUES(LgaCode), updated_at = VALUES(updated_at)`,
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


