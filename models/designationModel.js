const db = require("../dbConnection");
const { lowerCase } = require("../utils");

module.exports = {
  //******** GET A LIST OF DesignationS *******************************
  getAllDesignations: (offset, per_page, is_paginated, hierarchy_id, callback) => {
    //  console.log(is_paginated);
    const vyeoQuery = `SELECT 
      r.id as id,
      r.name as name, 
      v.rank_name as role, 
      r.vyeoId AS level,
      r.status_id AS status
      FROM roles r
      LEFT JOIN vyeo v ON v.id = r.vyeoId 
      ${is_paginated ? "" : " WHERE r.status_id = 1 AND r.vyeoId = ?"}
      ${is_paginated ? ' LIMIT ?,?' : ''}`;
    db.query(
      vyeoQuery,
      is_paginated ? [offset, per_page] : [hierarchy_id],
      (error, designations, fields) => {
        db.query(
          `SELECT vyeo.id as id, vyeo.rank_name as name 
          FROM vyeo where status_id = 1`, 
            (error2 , levels) => {
                  if(error2){
                    error = error2;
                    console.log(error2);
                  }
               db.query(
                 "SELECT COUNT(*) AS num_rows FROM roles",
                 (error3, result, fields2) => {
                      if(error3){
                        error = error3;
                      }
                   callback(error, designations, levels, result[0].num_rows);
                 }
               );
            });       
      }
    );
  },

  lookupDesignations: (hierarchy_id, callback) => {
    
    db.query(
      `SELECT 
        r.id as id,
        r.name as name, 
        v.rank_name as role, 
        r.vyeoId AS level,
        r.status_id AS status
        FROM roles r
        LEFT JOIN vyeo v ON v.id = r.vyeoId 
        WHERE r.status_id = 1 AND r.vyeoId = ?`,
      [hierarchy_id],
      (error, designations) => {
        if(error) console.log(error)
        callback(error, designations);      
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
                 `INSERT INTO roles (name , vyeoId , status_id, created_at) VALUES ?`,
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
      `SELECT id , Designation_name , display_name , status_id FROM Designations WHERE id = ?`,
      [id],
      (error, designation) => {
        if (error) {
          console.log("Error", err);
        }
        if (designation) {
          success = true;
        }
        callback(error, success, designation);
      }
    );
  },

  //******** UPDATE Designation *******************************
  updateDesignation: ( data, callback) => {
    var success = false;
       db.query(
         `SELECT * FROM roles WHERE name =  ?  AND id <> ?`,
         [lowerCase(data[0].trim()), data[4]],
         (err, result) => {
            if(err) console.log(err)
            if(result.length == 0){
               db.query(
                 `UPDATE  roles SET name = ? , vyeoId = ? , status_id = ? , updated_at = ?  WHERE id = ?`,
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
      "SELECT COUNT(*) AS num_rows FROM Designation_Designation WHERE Designation_id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        if (numRows > 0) {
          callback(
            "Haujafanikiwa kufuta kwa kuwa Designation hii inatumiwa na Designation " +
              numRows,
            success,
            []
          );
          return;
        } else {
          db.query(
            `DELETE FROM Designations  WHERE id = ?`,
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
