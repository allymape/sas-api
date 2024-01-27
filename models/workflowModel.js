const db = require("../dbConnection");
const { formatDate } = require("../utils");

module.exports = {
  //******** GET A LIST OF WORKFLOWS *******************************
  getAllWorkflows: (offset, per_page, is_paginated, application_category_id, callback) => {
   
    const filter =
      application_category_id && application_category_id.length > 0
        ? `WHERE w.application_category_id IN (${db.escape(
            application_category_id.length == 1
              ? application_category_id
              : application_category_id.map(Number)
          )}) `
        : "";
    const sql_from = `FROM work_flow w
          INNER JOIN application_categories ac ON ac.id = w.application_category_id
          INNER JOIN vyeo v ON v.id = w.start_from
          INNER JOIN vyeo v2 ON v2.id = w.end_to
          ${filter}
          ORDER BY application_category_id ASC, _order ASC`;
    
    db.query(
      `SELECT w.id AS id, application_category_id, ac.app_name AS app_name, v.rank_name AS start_from, v2.rank_name AS end_to , _order
       ${sql_from} 
       ${is_paginated ? " LIMIT ?,?" : ""}`,
      is_paginated ? [offset, per_page] : [],
      (error, results) => {
        if (error) console.log(error);
        db.query(
          `SELECT COUNT(*) AS num_rows ${sql_from}`,
          (error2, result, fields2) => {
            if (error2) console.log(error2);
            callback(error, results, result[0].num_rows);
          }
        );
      }
    );
  },
  //******** STORE WORKFLOW *******************************
  storeWorkflow: (data , callback) => {
    db.query(
      `INSERT INTO work_flow(application_category_id , start_from , end_to , _order , created_at) VALUES ? 
      ON DUPLICATE KEY UPDATE application_category_id = VALUES(application_category_id) , start_from = VALUES(start_from), end_to = VALUES(end_to) , _order = VALUES(_order) , updated_at = VALUES(updated_at)`,
      [data],
      (error, results) => {
        if (error) {
          console.log(error);
          callback(
            false,
            "Haujafanikiwa Kuongeza Utendaji Kazi (Workflow) " + error.code
          );
        } else {
          callback(
            results.affectedRows > 0 ? true : false,
            "Umefanikiwa kuongeza Utendaji Kazi (Workflow)"
          );
        }
      }
    );
    
  },
  //******** FIND WORKFLOW *******************************
  findWorkflow: (id, callback) => {
    var success = false;
    db.query(
      `SELECT id ,start_from, end_to, _order FROM work_flow WHERE id = ?`,
      [Number(id)],
      (error, work_flow) => {
        if (error) {
          console.log("Error", error);
        }
        if (work_flow) {
          success = true;
        }
        callback(error, success, work_flow.length > 0 ? work_flow[0] : null );
      }
    );
  },

  //******** UPDATE WORKFLOW *******************************
  updateWorkflow: (id , data, callback) => {
       db.query(
      `UPDATE work_flow 
       SET application_category_id = ? , start_from = ? , end_to = ? , _order = ? , updated_at = ? 
       WHERE id = ?`,
        [
          Number(data.application_category_id),
          Number(data.from),
          Number(data.to),
          Number(data.order),
          formatDate(new Date()),
          id
        ],
      (error, results) => {
        if (error) {
          console.log(error);
          callback(
            false,
            "Haujafanikiwa Kubadili Utendaji Kazi (Workflow) " +
              error.code
          );
        } else {
          callback(
            results.affectedRows > 0 ? true : false,
            "Umefanikiwa Kubadili Utendaji Kazi (Workflow)"
          );
        }
      }
    );
  },

  //******** DELETE WORKFLOW *******************************
  deleteWorkflow: (id, callback) => {
    var success = false;
          db.query(
            `DELETE FROM algorthm WHERE id = ?`,
            [id],
            (error, deletedAlgorthm) => {
              if (error) {
                console.log(error);
              }
              if (deletedAlgorthm.affectedRows > 0) {
                success = true;
              }
              callback(error, success, deletedAlgorthm);
            }
          );
  },
};
