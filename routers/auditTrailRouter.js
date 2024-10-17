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
                              staffs.name LIKE ? OR 
                              event_type LIKE ? OR 
                              ip_address LIKE ? OR 
                              old_body LIKE ? OR 
                              new_body LIKE ? OR 
                              tableName LIKE ? OR 
                              api_router LIKE ? OR 
                              audit_trail.id LIKE ?)`;
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
                  FROM audit_trail
                  JOIN staffs ON audit_trail.user_id = staffs.id 
                  WHERE 1=1 
                  ${searchQuery}
                  ORDER BY audit_trail.id DESC`;
       const sql_rows = `SELECT audit_trail.id as id, audit_trail.event_type as event_type, 
                              audit_trail.created_at as created_at, audit_trail.ip_address as ip_address, 
                              audit_trail.api_router as api_router, audit_trail.browser_used as browser_used, 
                              audit_trail.message as message, name, rollId, tableName, old_body, new_body
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
