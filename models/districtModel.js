const db = require("../dbConnection");
module.exports = {
  //******** GET A LIST OF DISTRICTS *******************************
  getAllDistricts: (offset, per_page, is_paginated , region_code, callback) => {

    db.query(
      `SELECT districts.id AS id, regions.id AS reg_id, regions.RegionName AS regionName,
      districts.LgaName AS LgaName , IFNULL(ngazi, '') AS ngazi, districts.LgaCode AS LgaCode , 
      districts.sqa_box AS sqa_box , districts.district_box AS lga_box,
      districts.created_at AS createdAt , districts.updated_at AS updatedAt 
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
   lookupDistricts: (user, region_code, callback) => {
    db.query(
      ` SELECT regions.id AS reg_id, regions.RegionName AS regionName,districts.LgaName AS LgaName, districts.LgaCode AS LgaCode , districts.created_at AS createdAt , districts.updated_at AS updatedAt 
        FROM districts, regions 
        WHERE districts.RegionCode = regions.RegionCode AND districts.RegionCode = ?
        ${
          ["wilaya"].includes(user.ngazi)
            ? " AND districts.LgaCode = '"+user.district_code+"'"
            : ""
        }
        ORDER BY RegionName ASC`,
      [region_code],
      (error, districts) => {
        if (error) {
          console.log(error);
        }
        callback(error, districts);
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
  //***********Update*************/
  updateDistrict : (formData , callback) => {
      db.query(`UPDATE districts SET sqa_box = ? , district_box = ? , ngazi = ?  WHERE id = ?` , formData , (error , district ) => {
        if(error) console.log(error)
          if(district.affectedRows > 0){
            callback(true)
          }else{
            callback(false)
          }
      })
  }
};