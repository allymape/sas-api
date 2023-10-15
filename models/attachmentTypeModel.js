const db = require("../dbConnection");

module.exports = {
  //******** GET A LIST OF ATTACHMENT TYPES *******************************
  getAllAttachmentTypes: (offset, per_page, callback) => {
    db.query(
      `SELECT a.id as id, app_name, file_size as size, file_format, 
              attachment_name,IFNULL(registry , '') as registry,a.status_id as status, 
              registry_type_id as registration_type_id, application_category_id , 
              IFNULL(rs.structure , '') AS structure,
              a.registration_structure_id AS structure_id
      FROM attachment_types a
      INNER JOIN application_categories ac ON ac.id = a.application_category_id
      LEFT  JOIN registry_types rt ON a.registry_type_id = rt.id
      LEFT JOIN registration_structures rs ON rs.id = a.registration_structure_id
      LIMIT ?,?`,
      [offset, per_page],
      (error, AttachmentTypes) => {
        console.log(AttachmentTypes)
        if (error) console.log(error);
        db.query(
          "SELECT COUNT(*) AS num_rows FROM attachment_types",
          (error2, result) => {
            if (error2) {
              console.log(error2);
              error = error2;
            }
            callback(error, AttachmentTypes, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE ATTACHMENT TYPES *******************************
  storeAttachmentTypes: (formData, callback) => {
    var success = false;
    db.query(
      `INSERT INTO attachment_types (attachment_name, file_size , file_format,registry_type_id, application_category_id , registration_structure_id , status_id, created_at) VALUES ?`,
      [formData],
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
  //******** FIND ATTACHMENT TYPE *******************************
  findAttachmentType: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id , AttachmentTypes_name , display_name , status_id FROM AttachmentTypes WHERE id = ?`,
      [id],
      (error, AttachmentTypes) => {
        if (error) {
          console.log("Error", error);
        }
        if (AttachmentTypes) {
          success = true;
        }
        callback(error, success, AttachmentTypes);
      }
    );
  },

  //******** UPDATE ATTACHMENT TYPE *******************************
  updateAttachmentType: (id, formData ,callback) => {
    var success = false;
    db.query(
      `UPDATE attachment_types SET attachment_name = ?, file_size = ?, 
              file_format = ?, registry_type_id = ?, application_category_id = ? , registration_structure_id = ? , status_id = ?  
       WHERE id = ?`,
      formData,
      (error, AttachmentTypes, fields) => {
        if (error) {
          console.log("Error", error);
        }
        if (AttachmentTypes) {
          success = true;
        }
        callback(error, success, AttachmentTypes);
      }
    );
  },

  //******** DELETE ATTACHMENT TYPE *******************************
  deleteAttachmentType: (id, callback) => {
    var success = false;
    db.query(
      "SELECT COUNT(*) AS num_rows FROM AttachmentTypes_role WHERE AttachmentTypes_id = ?",
      [id],
      (error, result) => {
        if (error) {
          console.log(error);
        }
        var numRows = result[0].num_rows;
        if (numRows > 0) {
          callback(
            "Haujafanikiwa kufuta kwa kuwa AttachmentTypes hii inatumiwa na role " +
              numRows,
            success,
            []
          );
          return;
        } else {
          db.query(
            `DELETE FROM AttachmentTypes  WHERE id = ?`,
            [id],
            (error2, deletedAttachmentTypes) => {
              if (error2) {
                console.log("Error", error2);
                error2 = error2 ? "Haikuweza kufuta kuna tatizo" : "";
              }
              if (deletedAttachmentTypes) {
                success = true;
              }
              callback(error2, success, deletedAttachmentTypes);
              return;
            }
          );
        }
      }
    );
  },
};
