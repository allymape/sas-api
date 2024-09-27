const db = require("../dbConnection");
module.exports = {
  //******** GET A LIST OF DISTRICTS *******************************
  getAllDistricts: (
    offset,
    per_page,
    search_value,
    callback
  ) => {
    var searchQuery = '';
    var queryParams = [];
    if (search_value) {
      searchQuery += ` AND (d.LgaName LIKE ? 
                       OR r.RegionName LIKE ?
                       OR d.ngazi LIKE ?
                       OR d.LgaCode LIKE ?
                       )`;
      queryParams.push(`%${search_value}%`, `%${search_value}%`, `%${search_value}%` , `%${search_value}%`);
    }

    let sql = ` FROM districts AS d
                JOIN regions AS r ON d.RegionCode = r.RegionCode
                WHERE 1 = 1 
                ${searchQuery}
                ORDER BY RegionName ASC 
                 `;
    db.query(
      `SELECT d.id AS id, r.id AS reg_id, r.RegionName AS regionName,
              d.LgaName AS LgaName , IFNULL(ngazi, '') AS ngazi, d.LgaCode AS LgaCode , 
              d.sqa_box AS sqa_box , d.district_box AS lga_box,
              d.created_at AS createdAt , d.updated_at AS updatedAt 
              ${sql}
              ${per_page > 0 ? "LIMIT ? , ?" : ""}
              `,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, districts) => {
        if (error) {
          console.log(error);
        }
        db.query(
          `SELECT COUNT(*) AS num_rows ${sql}`,
          queryParams,
          (error2, result) => {
            if (error2) console.log(error2);
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
            ? " AND districts.LgaCode = '" + user.district_code + "'"
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
  updateDistrict: (formData, callback) => {
    db.query(
      `UPDATE districts SET sqa_box = ? , district_box = ? , ngazi = ? , updated_at = ? 
              WHERE id = ?`,
      formData,
      (error, district) => {
        if (error) console.log(error);
        if (district.affectedRows > 0) {
          callback(true);
        } else {
          callback(false);
        }
      }
    );
  },
};