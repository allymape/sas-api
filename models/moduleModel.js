const db = require("../config/database");

const normalizePaginationFlag = (is_paginated) =>
  !(is_paginated === false || is_paginated === "false" || is_paginated === 0 || is_paginated === "0");

const normalizeActiveFlag = (value, fallback = 1) => {
  if (typeof value === "undefined" || value === null || value === "") {
    return Number(fallback) === 0 ? 0 : 1;
  }
  return Number(value) === 0 || value === false || value === "false" ? 0 : 1;
};

module.exports = {
  getAllModules: (offset, per_page, is_paginated, search, callback, status = false) => {
    const paginated = normalizePaginationFlag(is_paginated);
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const where = [];
    const params = [];

    if (status !== false && status !== null && typeof status !== "undefined") {
      where.push("m.is_active = ?");
      params.push(Number(status) === 1 || status === true ? 1 : 0);
    }

    const searchText = String(search || "").trim();
    if (searchText) {
      where.push("(m.module_name LIKE ? OR m.display_name LIKE ?)");
      params.push(`%${searchText}%`, `%${searchText}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const baseSql = `FROM modules m
                     LEFT JOIN staffs sc ON sc.id = m.created_by
                     LEFT JOIN staffs su ON su.id = m.updated_by
                     ${whereSql}`;

    db.query(
      `SELECT
         m.id,
         m.module_name,
         m.display_name,
         m.is_active,
         m.created_at,
         m.updated_at,
         m.created_by,
         m.updated_by,
         sc.name AS created_by_name,
         su.name AS updated_by_name
       ${baseSql}
       ORDER BY m.module_name ASC
       ${paginated ? "LIMIT ?,?" : ""}`,
      paginated ? [...params, safeOffset, safePerPage] : params,
      (error, modules = []) => {
        if (error) {
          callback(error, [], 0);
          return;
        }

        db.query(
          `SELECT COUNT(*) AS num_rows ${baseSql}`,
          params,
          (countError, result = []) => {
            if (countError) {
              callback(countError, [], 0);
              return;
            }
            callback(null, modules, Number(result[0]?.num_rows || 0));
          }
        );
      }
    );
  },

  storeModule: (payload, callback) => {
    const moduleName = String(payload?.module_name || "").trim();
    const displayName = String(payload?.display_name || "").trim() || null;
    const createdBy = Number(payload?.created_by || 0) || null;
    const updatedBy = Number(payload?.updated_by || createdBy || 0) || null;
    const isActive = normalizeActiveFlag(payload?.is_active, 1);

    if (!moduleName) {
      callback(new Error("Jina la moduli ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM modules WHERE LOWER(module_name) = LOWER(?) LIMIT 1",
      [moduleName],
      (existsError, existsRows = []) => {
        if (existsError) {
          callback(existsError, false, null, false);
          return;
        }

        if (existsRows.length > 0) {
          callback(null, false, null, true);
          return;
        }

        db.query(
          `INSERT INTO modules (module_name, display_name, is_active, created_at, updated_at, created_by, updated_by)
           VALUES (?, ?, ?, NOW(), NOW(), ?, ?)`,
          [moduleName, displayName, isActive, createdBy, updatedBy],
          (insertError, result) => {
            if (insertError) {
              callback(insertError, false, null, false);
              return;
            }
            callback(null, result?.affectedRows > 0, result, false);
          }
        );
      }
    );
  },

  findModule: (id, callback) => {
    db.query(
      `SELECT m.id,
              m.module_name,
              m.display_name,
              m.is_active,
              m.created_at,
              m.updated_at,
              m.created_by,
              m.updated_by,
              sc.name AS created_by_name,
              su.name AS updated_by_name
       FROM modules m
       LEFT JOIN staffs sc ON sc.id = m.created_by
       LEFT JOIN staffs su ON su.id = m.updated_by
       WHERE m.id = ?`,
      [id],
      (error, rows = []) => {
        callback(error, !error && rows.length > 0, rows);
      }
    );
  },

  updateModule: (payload, id, callback) => {
    const moduleName = String(payload?.module_name || "").trim();
    const displayName = String(payload?.display_name || "").trim() || null;
    const updatedBy = Number(payload?.updated_by || 0) || null;
    const isActive = normalizeActiveFlag(payload?.is_active, 0);

    if (!moduleName) {
      callback(new Error("Jina la moduli ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM modules WHERE LOWER(module_name) = LOWER(?) AND id <> ? LIMIT 1",
      [moduleName, id],
      (existsError, existsRows = []) => {
        if (existsError) {
          callback(existsError, false, null, false);
          return;
        }

        if (existsRows.length > 0) {
          callback(null, false, null, true);
          return;
        }

        db.query(
          `UPDATE modules
           SET module_name = ?, display_name = ?, is_active = ?, updated_at = NOW(), updated_by = ?
           WHERE id = ?`,
          [moduleName, displayName, isActive, updatedBy, id],
          (updateError, result) => {
            if (updateError) {
              callback(updateError, false, null, false);
              return;
            }
            callback(null, result?.affectedRows > 0, result, false);
          }
        );
      }
    );
  },

  deleteModule: (id, callback) => {
    db.query(
      "SELECT COUNT(*) AS num_rows FROM permissions WHERE module_id = ?",
      [id],
      (usageError, usageRows = []) => {
        if (usageError) {
          callback("Haikuweza kufuta moduli kwa sasa.", false, []);
          return;
        }

        const usedByPermissions = Number(usageRows[0]?.num_rows || 0);
        if (usedByPermissions > 0) {
          callback(
            `Haujafanikiwa kufuta kwa kuwa moduli hii inatumiwa na permissions ${usedByPermissions}.`,
            false,
            []
          );
          return;
        }

        db.query("DELETE FROM modules WHERE id = ?", [id], (deleteError, result) => {
          if (deleteError) {
            callback("Haikuweza kufuta moduli kwa sasa.", false, []);
            return;
          }
          callback(null, result?.affectedRows > 0, result);
        });
      }
    );
  },
};
