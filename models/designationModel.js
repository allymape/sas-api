const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF DesignationS *******************************
  getAllDesignations: (offset, per_page, is_paginated, callback) => {
    //  console.log(is_paginated);
    const vyeoQuery = `SELECT vyeo.id as vyeoId, roles.id as rolesId,
      roles.name as name, vyeo.rank_name as role, roles.status_id AS status
      FROM roles
      RIGHT JOIN vyeo ON vyeo.id = roles.vyeoId 
      ${is_paginated ? "" : " AND vyeo.status_id = 1"}
      ${is_paginated ? ' LIMIT ?,?' : ''}`;

    db.query(
      vyeoQuery,
      is_paginated ? [offset, per_page] : [],
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
  //******** STORE Designation *******************************
  storeRole: (DesignationData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO Designations (Designation_name , display_name , status_id, created_at , created_by) VALUES ?`,
      [DesignationData],
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
  },
  //******** FIND Designation *******************************
  findRole: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , Designation_name , display_name , status_id FROM Designations WHERE id = ?`,
      [id],
      (error, Designation) => {
        if (error) {
          console.log("Error", err);
        }
        if (Designation) {
          success = true;
        }
        callback(error, success, Designation);
      }
    );
  },

  //******** UPDATE Designation *******************************
  updateRole: (name, display, status, id, callback) => {
    var success = false;
    db.query(
      `UPDATE  Designations SET Designation_name = ? , display_name = ? , status_id = ?  WHERE id = ?`,
      [name, display, status, id],
      (error, Designation, fields) => {
        if (error) {
          console.log("Error", error);
        }
        if (Designation) {
          success = true;
        }
        callback(error, success, Designation);
      }
    );
  },

  //******** DELETEt Designation *******************************
  deleteRole: (id, callback) => {
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
            (error2, deletedRole) => {
              if (error2) {
                console.log("Error", error2);
                error2 = error2 ? "Haikuweza kufuta kuna tatizo" : "";
              }
              if (deletedRole) {
                success = true;
              }
              callback(error2, success, deletedRole);
              return;
            }
          );
        }
      }
    );
  },
};
