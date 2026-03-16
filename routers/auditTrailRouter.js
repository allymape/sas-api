require("dotenv").config();
const express = require("express");
const auditTrailRouter = express.Router();
const sharedModel = require("../models/sharedModel");
const { isAuth } = require("../utils");

const isLocalRequest = (req = {}) => {
  const ip = String(
    req?.headers?.["x-forwarded-for"] ||
    req?.ip ||
    req?.socket?.remoteAddress ||
    ""
  )
    .split(",")[0]
    .trim();

  return ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"].includes(ip);
};

const authOrLocal = (req, res, next) => {
  const authorization = String(req?.headers?.authorization || "").trim();
  if (authorization) {
    return isAuth(req, res, next);
  }

  if (isLocalRequest(req)) {
    return next();
  }

  return res.status(401).send({ message: "You are not authenticated." });
};

const toSafeText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const getPayload = (req = {}) => (req.method === "GET" ? req.query || {} : req.body || {});

const listAuditTrail = (req, res) => {
       const source = getPayload(req);
       const per_page_raw = Number.parseInt(source.per_page, 10) || 10;
       const per_page = per_page_raw > 0 ? per_page_raw : 10;
       const page_raw = Number.parseInt(source.page, 10) || 1;
       const page = page_raw > 0 ? page_raw : 1;
       const offset = (page - 1) * per_page;
       const search_value =
         toSafeText(
           source.search_value ||
           source?.search?.value ||
           source["search[value]"] ||
           source.search ||
           ""
         );
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
                          LIMIT ${offset}, ${per_page}`;
        const sql_count = `SELECT COUNT(*) num_rows ${sqlFrom}`;
       sharedModel.paginate(
        sql_rows,
        sql_count,
        (error, data, numRows) => {
          if (error) {
            console.log("[audit-trail][error]", error);
          }
          return res.send({
            data: error ? [] : data,
            numRows: error ? 0 : numRows,
            statusCode: error ? 306 : 300,
            message: error ? "Imeshindikana kupata audit trail." : "Audit trail list.",
          });
        },
        queryParams
      );
};

// List of
auditTrailRouter.get("/audit-trail",authOrLocal, listAuditTrail);
auditTrailRouter.post("/audit-trail",authOrLocal, listAuditTrail);

module.exports = auditTrailRouter;
