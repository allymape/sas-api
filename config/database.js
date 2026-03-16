require("dotenv").config();
var mysql = require("mysql2");
const { getRequestContext } = require("../src/Utils/requestContext");

var conn = mysql.createConnection({
  host: process.env.DB_HOST || "localhost", // Replace with your host name
  user: process.env.DB_USERNAME, // Replace with your database username
  password: process.env.DB_PASSWORD, // Replace with your database password
  database: process.env.DB_DATABASE, // // Replace with your database Name
  timezone: process.env.TIMEZONE || "+03:00",
  multipleStatements: true,
  debug: false,
});

const isTruthy = (value, fallback = false) => {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  return ["1", "true", "yes", "y", "on"].includes(String(value).trim().toLowerCase());
};

const AUTO_AUDIT_ENABLED = isTruthy(process.env.API_AUDIT_AUTO_LOG, true);
const IGNORED_TABLES = new Set(["audit_trail", "system_logs"]);

const getIpAddress = (req = {}) =>
  String(
    req?.headers?.["x-forwarded-for"] ||
      req?.ip ||
      req?.socket?.remoteAddress ||
      ""
  )
    .split(",")[0]
    .trim() || null;

const getBrowserUsed = (req = {}) =>
  String(req?.headers?.["user-agent"] || "").trim() || null;

const safeSlice = (value, max = 2000) => {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const jsonReplacer = (_, value) => {
  if (Buffer.isBuffer(value)) return `<Buffer length=${value.length}>`;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  return value;
};

const trimForAudit = (value, depth = 0) => {
  if (depth > 4) return "[MaxDepth]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return safeSlice(value, 800);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return Number(value);
  if (Buffer.isBuffer(value)) return `<Buffer length=${value.length}>`;
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    const limited = value.slice(0, 30).map((item) => trimForAudit(item, depth + 1));
    if (value.length > 30) limited.push(`[+${value.length - 30} more]`);
    return limited;
  }

  if (typeof value === "object") {
    const out = {};
    const entries = Object.entries(value).slice(0, 40);
    entries.forEach(([key, item]) => {
      out[key] = trimForAudit(item, depth + 1);
    });
    if (Object.keys(value).length > 40) {
      out.__truncated_keys = Object.keys(value).length - 40;
    }
    return out;
  }

  return safeSlice(String(value), 500);
};

const toAuditJson = (value) => {
  try {
    return JSON.stringify(trimForAudit(value), jsonReplacer);
  } catch (error) {
    return JSON.stringify({
      raw: safeSlice(String(value ?? ""), 2000),
      serialization_error: String(error?.message || "unknown error"),
    });
  }
};

const parseWriteMeta = (sql = "") => {
  const cleanSql = String(sql || "")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--.*$/gm, " ")
    .trim();
  if (!cleanSql) return null;

  const first = cleanSql.match(/^([a-z]+)/i);
  const keyword = String(first?.[1] || "").toUpperCase();
  if (!["INSERT", "UPDATE", "DELETE"].includes(keyword)) return null;

  let tableName = "";
  if (keyword === "INSERT") {
    tableName = String(cleanSql.match(/^INSERT(?:\s+IGNORE)?\s+INTO\s+`?([a-zA-Z0-9_]+)/i)?.[1] || "");
  } else if (keyword === "UPDATE") {
    tableName = String(cleanSql.match(/^UPDATE\s+`?([a-zA-Z0-9_]+)/i)?.[1] || "");
  } else if (keyword === "DELETE") {
    tableName = String(cleanSql.match(/^DELETE\s+FROM\s+`?([a-zA-Z0-9_]+)/i)?.[1] || "");
  }

  const tableLower = tableName.toLowerCase();
  if (!tableLower || IGNORED_TABLES.has(tableLower)) return null;

  const eventType =
    keyword === "INSERT"
      ? "created"
      : keyword === "UPDATE"
        ? "updated"
        : "delete";

  return {
    keyword,
    eventType,
    tableName,
    sqlPreview: safeSlice(cleanSql, 2000),
  };
};

const originalQuery = conn.query.bind(conn);

const insertAutoAuditTrail = (meta, values, result) => {
  if (!AUTO_AUDIT_ENABLED) return;

  const ctx = getRequestContext();
  const req = ctx?.req;
  if (!req) return;

  const user = req?.user || {};
  const userId = Number(user?.id || user?.user_id || user?.userId || 0) || null;
  const rollId = Number(user?.user_level || user?.role_id || user?.new_role_id || 0) || null;

  const endpoint = String(req?.originalUrl || req?.url || "").slice(0, 50) || null;
  const ipAddress = getIpAddress(req);
  const browserUsed = getBrowserUsed(req);

  const affectedRows = Number(result?.affectedRows || 0);
  const changedRows = Number(result?.changedRows || 0);
  const insertId = Number(result?.insertId || 0) || null;

  const payload = {
    sql: meta.sqlPreview,
    params: values ?? null,
    affected_rows: Number.isFinite(affectedRows) ? affectedRows : null,
    changed_rows: Number.isFinite(changedRows) ? changedRows : null,
    insert_id: insertId,
    method: req?.method || null,
  };

  const message = `${meta.keyword} query executed on ${meta.tableName}`;

  originalQuery(
    `INSERT INTO audit_trail
      (user_id, event_type, new_body, old_body, created_at, ip_address, api_router, browser_used, rollId, message, tableName)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      meta.eventType,
      toAuditJson(payload),
      null,
      new Date(),
      ipAddress,
      endpoint,
      browserUsed,
      rollId,
      safeSlice(message, 1000),
      meta.tableName,
    ],
    () => {}
  );
};
 
conn.connect((err) => {
  if (err) {
    console.error(`Error connecting to database ${process.env.DB_DATABASE} host: ${process.env.DB_HOST} username: ${process.env.DB_USERNAME}:`, err);
    return;
  };
  console.info(`Database is connected successfully! Server: ${process.env.DB_HOST}`);
});


conn.on("error", (err) => {
  console.log("Mysql Error: " + err);
});

conn.query = function patchedQuery(sql, values, callback) {
  const hasValues = typeof values !== "function";
  const cb = typeof values === "function" ? values : callback;
  const writeMeta = parseWriteMeta(sql);

  if (!writeMeta || typeof cb !== "function") {
    return originalQuery(sql, values, callback);
  }

  const wrappedCallback = function queryCallback(err, result, fields) {
    if (!err) {
      insertAutoAuditTrail(writeMeta, hasValues ? values : null, result);
    }
    cb(err, result, fields);
  };

  if (hasValues) {
    return originalQuery(sql, values, wrappedCallback);
  }
  return originalQuery(sql, wrappedCallback);
};

module.exports = conn;
