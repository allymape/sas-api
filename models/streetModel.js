const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF streets *******************************
  getAllStreets: (offset, per_page, search_value , callback) => {
    var searchQuery = "";
    var queryParams = [];
    if (search_value) {
      searchQuery += ` AND (RegionName LIKE ? OR LgaName LIKE ? OR WardName LIKE ? OR StreetName LIKE ? OR StreetCode LIKE ?)`;
      queryParams.push(
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`,
        `%${search_value}%`, 
        `%${search_value}%`
      );
    }
    let sql = ` FROM streets s
                JOIN wards w  ON w.WardCode = s.WardCode
                JOIN districts d ON w.LgaCode = d.LgaCode
                JOIN regions r ON d.RegionCode = r.RegionCode
                WHERE 1 = 1 
                ${searchQuery}
                ORDER BY RegionName ASC, LgaName  ASC `;

    db.query(
      ` SELECT s.id AS id , StreetCode, StreetName, WardName, LgaName, RegionName, s.created_at AS CreatedAt , s.updated_at AS UpdatedAt 
        ${sql}
        ${per_page > 0 ? "LIMIT ? , ?" : ""}`,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, streets) => {
        db.query(
          `SELECT COUNT(*) AS num_rows  ${sql}`,
          queryParams,
          (error2, result2) => {
            if (error2) {
              error = error2;
              console.log(error);
            }
            // console.log(regions);
            callback(error, streets, result2[0].num_rows);
          }
        );
      }
    );
  },
  lookupStreets: (ward_code, callback) => {
    db.query(
      `SELECT s.id AS id , StreetCode, StreetName, WardName, LgaName, RegionName, s.created_at AS CreatedAt , s.updated_at AS UpdatedAt 
      FROM streets s
      JOIN wards w  ON w.WardCode = s.WardCode
      JOIN districts d ON w.LgaCode = d.LgaCode
      JOIN regions r ON d.RegionCode = r.RegionCode
      WHERE s.WardCode = ? 
      ORDER BY StreetName ASC`,
      [ward_code],
      (error, streets) => {
        if (error) {
          console.log(error);
        }
        callback(error, streets);
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
