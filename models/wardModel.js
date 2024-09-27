const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF WARDS *******************************
  getAllWards: (offset, per_page, search_value, callback) => {
     var searchQuery = "";
     var queryParams = [];
     if (search_value) {
       searchQuery += ` AND (RegionName LIKE ? OR LgaName LIKE ? OR WardName LIKE ? OR WardCode LIKE ?)`;
       queryParams.push(`%${search_value}%`, `%${search_value}%`, `%${search_value}%`, `%${search_value}%`);
     }
     let sql = ` FROM wards w
                JOIN districts d ON d.LgaCode = w.LgaCode
                JOIN regions r ON r.RegionCode = d.RegionCode 
                WHERE 1 = 1 
                ${searchQuery}
                ORDER BY RegionName ASC, LgaName  ASC `;

     db.query(
       ` SELECT WardCode, WardName AS WardName, LgaName, RegionName , w.created_at AS CreatedAt , w.updated_at AS UpdatedAt 
        ${sql}
        ${per_page > 0 ? "LIMIT ? , ?" : ""}`,
       per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
       (error, wards) => {
         db.query(
           `SELECT COUNT(*) AS num_rows  ${sql}`,
           queryParams,
           (error2, result2) => {
             if (error2) {
               error = error2;
               console.log(error);
             }
             // console.log(regions);
             callback(error, wards, result2[0].num_rows);
           }
         );
       }
     );
  },
  lookupWards: (lga_code, callback) => {
    db.query(
      ` SELECT WardCode, WardName AS WardName, LgaName, RegionName , w.created_at AS CreatedAt , w.updated_at AS UpdatedAt 
        FROM wards w
        JOIN districts d ON d.LgaCode = w.LgaCode
        JOIN regions r ON r.RegionCode = d.RegionCode  
        WHERE w.LgaCode = ?
        ORDER BY WardName ASC`,
      [lga_code],
      (error, wards) => {
        if (error) {
          console.log(error);
        }
        callback(error, wards);
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
          console.log("Error", err);
        }
        if (result) {
          success = true;
        }
        callback(success);
      }
    );
  },
};


