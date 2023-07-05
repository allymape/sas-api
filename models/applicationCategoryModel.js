const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF APPLICATION CATEGORIES *******************************
  getAllApplicationCategories: (offset, per_page, is_paginated, callback) => {
    db.query(
      `SELECT id, app_name AS name 
       FROM application_categories  
       ${is_paginated ? "" : ""} 
       ${is_paginated ? " LIMIT ?,?" : ""}`,
      is_paginated ? [offset, per_page] : [],
      (error, applicationCategories, fields) => {
        db.query(
          "SELECT COUNT(*) AS num_rows FROM application_categories",
          (error2, result, fields2) => {
            callback(error, applicationCategories, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE APPLICATION CATEGORY *******************************
  storeApplicationCategories: (ApplicationCategoriesData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO ApplicationCategories (ApplicationCategories_name , display_name , status_id, created_at , created_by) VALUES ?`,
      [ApplicationCategoriesData],
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
  //******** FIND APPLICATION CATEGORY *******************************
  findApplicationCategory: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , ApplicationCategories_name , display_name , status_id FROM ApplicationCategories WHERE id = ?`,
      [id],
      (error, ApplicationCategories) => {
        if (error) {
          console.log("Error", err);
        }
        if (ApplicationCategories) {
          success = true;
        }
        callback(error, success, ApplicationCategories);
      }
    );
  },

  //******** UPDATE APPLICATION CATEGORY *******************************
  updateApplicationCategory: (name, display, status, id, callback) => {
    var success = false;
    db.query(
      `UPDATE  ApplicationCategories SET ApplicationCategories_name = ? , display_name = ? , status_id = ?  WHERE id = ?`,
      [name, display, status, id],
      (error, ApplicationCategories, fields) => {
        if (error) {
          console.log("Error", error);
        }
        if (ApplicationCategories) {
          success = true;
        }
        callback(error, success, ApplicationCategories);
      }
    );
  },

  //******** DELETE APPLICATION CATEGORY *******************************
  deleteApplicationCategory: (id, callback) => {
    var success = false;
    db.query(
      "SELECT COUNT(*) AS num_rows FROM ApplicationCategories_role WHERE ApplicationCategories_id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        if (numRows > 0) {
          callback(
            "Haujafanikiwa kufuta kwa kuwa ApplicationCategories hii inatumiwa na role " +
              numRows,
            success,
            []
          );
          return;
        } else {
          db.query(
            `DELETE FROM ApplicationCategories  WHERE id = ?`,
            [id],
            (error2, deletedApplicationCategories) => {
              if (error2) {
                console.log("Error", error2);
                error2 = error2 ? "Haikuweza kufuta kuna tatizo" : "";
              }
              if (deletedApplicationCategories) {
                success = true;
              }
              callback(error2, success, deletedApplicationCategories);
              return;
            }
          );
        }
      }
    );
  },
};
