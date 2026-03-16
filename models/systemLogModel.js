const db = require("../config/database");
const { LEVELS } = require("../src/Utils/systemLogService");

const toPositiveInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toSafeText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const isDateToken = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());

const parseJsonSafely = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const normalizeLevels = (value) => {
  const entries = String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => LEVELS.includes(item));
  return [...new Set(entries)];
};

const buildWhereClause = (filters = {}) => {
  const where = ["1=1"];
  const params = [];

  const levels = normalizeLevels(filters.level || filters.levels || "");
  if (levels.length > 0) {
    where.push(`sl.level IN (${levels.map(() => "?").join(",")})`);
    params.push(...levels);
  }

  const moduleName = toSafeText(filters.module, "");
  if (moduleName) {
    where.push("sl.module LIKE ?");
    params.push(`%${moduleName}%`);
  }

  const eventType = toSafeText(filters.event_type, "");
  if (eventType) {
    where.push("sl.event_type LIKE ?");
    params.push(`%${eventType}%`);
  }

  const search = toSafeText(filters.search, "");
  if (search) {
    where.push(`(
      sl.message LIKE ?
      OR sl.module LIKE ?
      OR sl.event_type LIKE ?
      OR IFNULL(sl.tracking_number,'') LIKE ?
      OR IFNULL(sl.endpoint,'') LIKE ?
      OR CAST(sl.id AS CHAR) LIKE ?
    )`);
    const searchValue = `%${search}%`;
    params.push(searchValue, searchValue, searchValue, searchValue, searchValue, searchValue);
  }

  const fromDate = toSafeText(filters.from, "");
  if (fromDate && isDateToken(fromDate)) {
    where.push("DATE(sl.created_at) >= ?");
    params.push(fromDate);
  }

  const toDate = toSafeText(filters.to, "");
  if (toDate && isDateToken(toDate)) {
    where.push("DATE(sl.created_at) <= ?");
    params.push(toDate);
  }

  return {
    whereSql: where.join(" AND "),
    params,
  };
};

const mapLogRow = (row = {}) => ({
  id: row.id,
  level: row.level,
  module: row.module,
  event_type: row.event_type,
  message: row.message,
  source: row.source,
  application_id: row.application_id,
  tracking_number: row.tracking_number,
  staff_id: row.staff_id,
  staff_name: row.staff_name,
  endpoint: row.endpoint,
  http_method: row.http_method,
  status_code: row.status_code,
  ip_address: row.ip_address,
  user_agent: row.user_agent,
  context: parseJsonSafely(row.context_json),
  causes: parseJsonSafely(row.causes_json),
  error_details: parseJsonSafely(row.error_json),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

module.exports = {
  getLogs: (filters = {}, callback) => {
    const isPaginated =
      !(
        filters.is_paginated === false ||
        filters.is_paginated === "false" ||
        filters.is_paginated === 0 ||
        filters.is_paginated === "0"
      );
    const perPage = Math.min(200, toPositiveInt(filters.per_page, 20));
    const page = toPositiveInt(filters.page, 1);
    const offset = (page - 1) * perPage;

    const { whereSql, params } = buildWhereClause(filters);

    const sqlRows = `
      SELECT
        sl.id,
        sl.level,
        sl.module,
        sl.event_type,
        sl.message,
        sl.source,
        sl.application_id,
        sl.tracking_number,
        sl.staff_id,
        s.name AS staff_name,
        sl.endpoint,
        sl.http_method,
        sl.status_code,
        sl.ip_address,
        sl.user_agent,
        sl.context_json,
        sl.causes_json,
        sl.error_json,
        sl.created_at,
        sl.updated_at
      FROM system_logs sl
      LEFT JOIN staffs s ON s.id = sl.staff_id
      WHERE ${whereSql}
      ORDER BY sl.id DESC
      ${isPaginated ? "LIMIT ?, ?" : ""}
    `;

    const sqlCount = `
      SELECT COUNT(*) AS num_rows
      FROM system_logs sl
      WHERE ${whereSql}
    `;

    const rowParams = isPaginated ? params.concat([offset, perPage]) : params;

    db.query(sqlRows, rowParams, (rowsError, rows = []) => {
      if (rowsError) {
        callback(rowsError, [], 0);
        return;
      }

      db.query(sqlCount, params, (countError, countRows = []) => {
        if (countError) {
          callback(countError, [], 0);
          return;
        }

        callback(
          null,
          Array.isArray(rows) ? rows.map(mapLogRow) : [],
          Number(countRows?.[0]?.num_rows || 0)
        );
      });
    });
  },

  getLogById: (id, callback) => {
    db.query(
      `SELECT
        sl.id,
        sl.level,
        sl.module,
        sl.event_type,
        sl.message,
        sl.source,
        sl.application_id,
        sl.tracking_number,
        sl.staff_id,
        s.name AS staff_name,
        sl.endpoint,
        sl.http_method,
        sl.status_code,
        sl.ip_address,
        sl.user_agent,
        sl.context_json,
        sl.causes_json,
        sl.error_json,
        sl.created_at,
        sl.updated_at
       FROM system_logs sl
       LEFT JOIN staffs s ON s.id = sl.staff_id
       WHERE sl.id = ?
       LIMIT 1`,
      [toPositiveInt(id, 0)],
      (error, rows = []) => {
        if (error) {
          callback(error, null);
          return;
        }

        const row = Array.isArray(rows) && rows.length > 0 ? mapLogRow(rows[0]) : null;
        callback(null, row);
      }
    );
  },

  getSummary: (filters = {}, callback) => {
    const { whereSql, params } = buildWhereClause(filters);

    const totalsSql = `
      SELECT
        COUNT(*) AS total,
        SUM(sl.level = 'critical') AS critical,
        SUM(sl.level = 'error') AS error,
        SUM(sl.level = 'warning') AS warning,
        SUM(sl.level = 'info') AS info,
        SUM(sl.level = 'debug') AS debug
      FROM system_logs sl
      WHERE ${whereSql}
    `;

    const byLevelSql = `
      SELECT sl.level, COUNT(*) AS total
      FROM system_logs sl
      WHERE ${whereSql}
      GROUP BY sl.level
      ORDER BY FIELD(sl.level, 'critical', 'error', 'warning', 'info', 'debug')
    `;

    const trendSql = `
      SELECT DATE(sl.created_at) AS log_date, sl.level, COUNT(*) AS total
      FROM system_logs sl
      WHERE ${whereSql}
      GROUP BY DATE(sl.created_at), sl.level
      ORDER BY DATE(sl.created_at) ASC
    `;

    const moduleSql = `
      SELECT sl.module, COUNT(*) AS total
      FROM system_logs sl
      WHERE ${whereSql}
      GROUP BY sl.module
      ORDER BY total DESC
      LIMIT 8
    `;

    const eventTypeSql = `
      SELECT sl.event_type, COUNT(*) AS total
      FROM system_logs sl
      WHERE ${whereSql}
      GROUP BY sl.event_type
      ORDER BY total DESC
      LIMIT 8
    `;

    db.query(totalsSql, params, (totalsError, totalsRows = []) => {
      if (totalsError) {
        callback(totalsError, null);
        return;
      }

      db.query(byLevelSql, params, (byLevelError, byLevelRows = []) => {
        if (byLevelError) {
          callback(byLevelError, null);
          return;
        }

        db.query(trendSql, params, (trendError, trendRows = []) => {
          if (trendError) {
            callback(trendError, null);
            return;
          }

          db.query(moduleSql, params, (moduleError, moduleRows = []) => {
            if (moduleError) {
              callback(moduleError, null);
              return;
            }

            db.query(eventTypeSql, params, (eventTypeError, eventTypeRows = []) => {
              if (eventTypeError) {
                callback(eventTypeError, null);
                return;
              }

              const totals = totalsRows?.[0] || {};
              callback(null, {
                level_totals: {
                  total: Number(totals.total || 0),
                  critical: Number(totals.critical || 0),
                  error: Number(totals.error || 0),
                  warning: Number(totals.warning || 0),
                  info: Number(totals.info || 0),
                  debug: Number(totals.debug || 0),
                },
                by_level: byLevelRows,
                trend: trendRows,
                top_modules: moduleRows,
                top_event_types: eventTypeRows,
              });
            });
          });
        });
      });
    });
  },
};

