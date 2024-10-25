require("dotenv").config();
const express = require("express");
const auditTrailRouter = express.Router();
const sharedModel = require("../models/sharedModel");
const { permission, isAuth } = require("../utils");

// List of
auditTrailRouter.get("/audit-trail",isAuth, permission('view-audit'), (req, res) => {  
       const per_page = parseInt(req.query.per_page);
       const page = parseInt(req.query.page);
       const offset = (page - 1) * per_page;
       let search_value = req.body.search.value;
       var searchQuery = "";
       var queryParams = [];
       if (search_value) {
         searchQuery += ` AND (
                              s.name LIKE ? OR 
                              event_type LIKE ? OR 
                              ip_address LIKE ? OR 
                              old_body LIKE ? OR 
                              new_body LIKE ? OR 
                              tableName LIKE ? OR 
                              api_router LIKE ? OR 
                              a.id LIKE ?)`;
         queryParams.push(
           `%${search_value}%`,
           `%${search_value}%`,
           `%${search_value}%`,
           `%${search_value}%`,
           `%${search_value}%`,
           `%${search_value}%`,
           `%${search_value}%`,
           `%${search_value}%`,
         );
       }
       const sqlFrom = `
                  FROM audit_trail a
                  JOIN staffs s ON a.user_id = s.id 
                  LEFT JOIN roles r ON r.id = s.user_level
                  WHERE 1=1 
                  ${searchQuery}
                  ORDER BY a.id DESC`;
       const sql_rows = `SELECT a.id as id, a.event_type as event_type, 
                              a.created_at as created_at, a.ip_address as ip_address, 
                              a.api_router as api_router, a.browser_used as browser_used, 
                              a.message as message, s.name AS name, r.name AS rollId, tableName, old_body, new_body
                          ${sqlFrom} 
                          LIMIT ?,?`;
        const sql_count = `SELECT COUNT(*) num_rows ${sqlFrom}`;
      sharedModel.paginate(
        sql_rows,
        sql_count,
        (error, data, numRows) => {
          if (error) console.log(error);
          return res.send({
            data,
            numRows,
          });
        },
        per_page > 0 ? queryParams.concat([offset, per_page]) : queryParams
      );
    
});

module.exports = auditTrailRouter;
