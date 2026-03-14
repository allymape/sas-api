const db = require("../config/database");
const { lowerCase } = require("../utils");

module.exports = {
  //******** GET A LIST OF DesignationS *******************************
  getAllDesignations: (offset, per_page, search_value, callback) => {
    var searchQuery = "";
    var queryParams = [];
    if (search_value) {
      searchQuery += ` AND (r.name LIKE ? OR rank_name LIKE ?)`;
      queryParams.push(`%${search_value}%` , `%${search_value}%`);
    }
    let sql = ` FROM roles r
                LEFT JOIN vyeo v ON v.id = r.vyeoId
                WHERE 1 = 1 
                ${searchQuery}
                ORDER BY r.name ASC  `;

    db.query(
      ` SELECT 
      r.id as id,
      r.name as name, 
      r.description AS description,
      v.rank_name as role, 
      r.vyeoId AS level,
      r.status_id AS status,
      r.created_at AS created_at ,
      r.updated_at AS updated_at
        ${sql}
        ${per_page > 0 ? "LIMIT ? , ?" : ""}`,
      per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams,
      (error, list) => {
        db.query(
          `SELECT COUNT(*) AS num_rows  ${sql}`,
          queryParams,
          (error2, result2) => {
            if (error2) {
              error = error2;
              console.log(error);
            }
            // console.log(regions);
            callback(error, list, result2[0].num_rows);
          }
        );
      }
    );
  },

  lookupDesignations: (hierarchy_id, callback) => {
    const sql = `SELECT 
        r.id as id,
        r.name as name, 
        v.rank_name as role, 
        r.vyeoId AS level,
        r.status_id AS status
        FROM roles r
        LEFT JOIN vyeo v ON v.id = r.vyeoId 
        WHERE r.status_id = 1
        ${hierarchy_id ? "AND r.vyeoId = ?" : ""}
        ORDER BY r.name ASC`;
    const queryParams = hierarchy_id ? [hierarchy_id] : [];
    db.query(
      sql,
      queryParams,
      (error, designations) => {
        if(error) console.log(error)
        callback(error , designations);      
      }
    );
  },
  //******** STORE Designation *******************************
  storeDesignation: (data, callback) => {
    var success = false;
    // console.log(data[0][0])
    db.query(
         `SELECT * FROM roles WHERE name =  ?`,
         [lowerCase(data[0].trim())],
         (err, result) => {
           if(err) console.log(err)
            if(result.length == 0){
               db.query(
                 `INSERT INTO roles (name , description , vyeoId , status_id, created_at) VALUES ?`,
                 [[data]],
                 (error, result) => {
                   if (error) {
                     console.log("Error", error);
                   }
                   if (result) {
                     success = true;
                   }
                   callback(error, success, result);
                 }
               );
            }else{
              callback(null, false, null , true);
            }
         });
  },

  //******** FIND Designation *******************************
  findDesignation: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , name , description , status_id FROM roles WHERE id = ?`,
      [id],
      (error, designation) => {
        if (error) {
          console.log("Error", error);
        }
        if (designation && designation.length > 0) {
          success = true;
        }
        callback(error, success, designation);
      }
    );
  },

  //******** UPDATE Designation *******************************
  updateDesignation: ( data, callback) => {
    var success = false;
    // console.log(data)
       db.query(
         `SELECT * FROM roles WHERE name =  ?  AND id <> ?`,
         [lowerCase(data[0].trim()), data[5]],
         (err, result) => {
            if(err) console.log(err)
            // console.log(result)
            if(result.length == 0){
               db.query(
                 `UPDATE  roles SET name = ? , description = ? , vyeoId = ? , status_id = ? , updated_at = ?  WHERE id = ?`,
                 data,
                 (error, designation) => {
                   if (error) {
                     console.log("Error", error);
                   }
                   if (designation.affectedRows > 0) {
                     success = true;
                   }
                   callback(error, success, designation);
                 }
               );
            }else{
              callback(null, false, null , true);
            }
         }
       );
  },

  //******** DELETEt Designation *******************************
  deleteDesignation: (id, callback) => {
    var success = false;
    db.query(
      "SELECT COUNT(*) AS num_rows FROM users WHERE role_id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        if (numRows > 0) {
          callback(
            "Haujafanikiwa kufuta kwa kuwa cheo hiki kinatumiwa na watumiaji " +
              numRows,
            success,
            []
          );
          return;
        } else {
          db.query(
            `DELETE FROM roles WHERE id = ?`,
            [id],
            (error2, deletedDesignation) => {
              if (error2) {
                console.log("Error", error2);
                error2 = error2 ? "Haikuweza kufuta kuna tatizo" : "";
              }
              if (deletedDesignation) {
                success = true;
              }
              callback(error2, success, deletedDesignation);
              return;
            }
          );
        }
      }
    );
  },
};
