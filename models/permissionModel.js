const db = require("../config/database");

const normalizePaginationFlag = (is_paginated) =>
  !(is_paginated === false || is_paginated === "false" || is_paginated === 0 || is_paginated === "0");

const normalizeModuleKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toDisplayLabelFromModuleKey = (moduleKey) =>
  ({
    "dashboard-gis": "Dashboard & GIS",
    applications: "Maombi",
    reports: "Reports and Analytics",
    "sys-logs-configurations": "Sys Logs and Configurations",
    "audit-trail": "Audit Trail",
    "staff-management": "Staff Management",
    "applicants-management": "Applicants Management",
    "administrative-areas": "Administrative Areas",
    setup: "Setup",
  }[normalizeModuleKey(moduleKey)] ||
    "Setup");

const ensureDefaultModuleId = (callback) => {
  db.query(
    "SELECT id FROM modules WHERE LOWER(module_name) = LOWER(?) LIMIT 1",
    ["setup"],
    (findError, rows = []) => {
      if (findError) {
        callback(findError, null);
        return;
      }

      if (rows.length > 0) {
        callback(null, Number(rows[0].id));
        return;
      }

      db.query(
        `INSERT INTO modules (module_name, display_name, is_active, created_at, updated_at, created_by, updated_by)
         VALUES (?, ?, ?, NOW(), NOW(), ?, ?)`,
        ["setup", "Setup", 1, 1, 1],
        (insertError, result) => {
          if (insertError) {
            callback(insertError, null);
            return;
          }
          callback(null, Number(result?.insertId || 0));
        }
      );
    }
  );
};

const ensureModulesByKeys = (moduleKeys = [], callback) => {
  const normalizedKeys = [...new Set((moduleKeys || []).map(normalizeModuleKey).filter(Boolean))];
  if (!normalizedKeys.length) {
    callback(null, {});
    return;
  }

  const now = new Date();
  const values = normalizedKeys.map((moduleKey) => [
    moduleKey,
    toDisplayLabelFromModuleKey(moduleKey),
    1,
    now,
    now,
    1,
    1,
  ]);

  db.query(
    `INSERT INTO modules (module_name, display_name, is_active, created_at, updated_at, created_by, updated_by)
     VALUES ? ON DUPLICATE KEY
     UPDATE display_name = VALUES(display_name), is_active = VALUES(is_active), updated_at = VALUES(updated_at), updated_by = VALUES(updated_by)`,
    [values],
    (insertError) => {
      if (insertError) {
        callback(insertError, {});
        return;
      }

      db.query(
        "SELECT id, module_name FROM modules WHERE module_name IN (?)",
        [normalizedKeys],
        (selectError, rows = []) => {
          if (selectError) {
            callback(selectError, {});
            return;
          }
          const moduleMap = {};
          rows.forEach((row) => {
            moduleMap[normalizeModuleKey(row.module_name)] = Number(row.id);
          });
          callback(null, moduleMap);
        }
      );
    }
  );
};

module.exports = {
  //******** GET A LIST OF PERMISSIONS *******************************
  getAllPermission: (
    offset,
    per_page,
    is_paginated,
    search,
    callback,
    status = false,
    is_default = null
  ) => {
    const paginated = normalizePaginationFlag(is_paginated);
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const where = [];
    const params = [];

    if (status !== false && status !== null && typeof status !== "undefined") {
      where.push("p.status_id = ?");
      params.push(Number(status) === 1 || status === true ? 1 : 0);
    }

    if (is_default !== null && typeof is_default !== "undefined") {
      where.push("p.is_default = ?");
      params.push(Number(is_default) === 1 || is_default === true ? 1 : 0);
    }

    const searchText = String(search || "").trim();
    if (searchText) {
      where.push(
        "(p.display_name LIKE ? OR p.permission_name LIKE ? OR m.module_name LIKE ? OR m.display_name LIKE ?)"
      );
      params.push(`%${searchText}%`, `%${searchText}%`, `%${searchText}%`, `%${searchText}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const commonSql = ` FROM permissions p
                        LEFT JOIN modules m ON m.id = p.module_id
                        ${whereSql}`;

    db.query(
      `SELECT p.*,
              m.module_name,
              m.display_name AS module_display_name
       ${commonSql}
       ORDER BY p.permission_name ASC
       ${paginated ? "LIMIT ?,?" : ""}`,
      paginated ? [...params, safeOffset, safePerPage] : params,
      (error, permissions = []) => {
        if (error) {
          callback(error, [], 0);
          return;
        }

        db.query(
          `SELECT COUNT(*) AS num_rows ${commonSql}`,
          params,
          (countError, result = []) => {
            if (countError) {
              callback(countError, [], 0);
              return;
            }
            callback(null, permissions, Number(result[0]?.num_rows || 0));
          }
        );
      }
    );
  },

  syncPermissions: (permissions, callback) => {
    try {
      ensureDefaultModuleId((moduleError, defaultModuleId) => {
        if (moduleError) {
          callback(moduleError, false, []);
          return;
        }
        const permissionRows = Array.isArray(permissions) ? permissions : [];
        const moduleKeysToEnsure = permissionRows
          .map((row = []) => row[7])
          .filter((moduleRef) => typeof moduleRef === "string" && String(moduleRef).trim() !== "")
          .map((moduleRef) => normalizeModuleKey(moduleRef));

        ensureModulesByKeys(moduleKeysToEnsure, (ensureError, ensuredModuleMap = {}) => {
          if (ensureError) {
            callback(ensureError, false, []);
            return;
          }

          const mappedPermissions = permissionRows.map((row = []) => {
            const moduleRef = row[7];
            let moduleId = defaultModuleId;

            if (Number.isFinite(Number(moduleRef)) && Number(moduleRef) > 0) {
              moduleId = Number(moduleRef);
            } else if (typeof moduleRef === "string") {
              const moduleKey = normalizeModuleKey(moduleRef);
              moduleId = Number(ensuredModuleMap[moduleKey] || defaultModuleId);
            }

            return [
              row[0], // id
              row[1], // permission_name
              moduleId, // module_id (required)
              row[2], // display_name
              row[3], // is_default
              row[4], // status_id
              row[5], // created_at
              row[6], // created_by
            ];
          });

          if (mappedPermissions.length === 0) {
            callback(null, true, { affectedRows: 0, message: "No permissions to sync." });
            return;
          }

          db.query(
            `INSERT INTO permissions (id, permission_name, module_id, display_name, is_default, status_id, created_at, created_by)
             VALUES ? ON DUPLICATE KEY
             UPDATE permission_name = VALUES(permission_name),
                    module_id = VALUES(module_id),
                    display_name = VALUES(display_name),
                    is_default = VALUES(is_default),
                    status_id = VALUES(status_id),
                    created_at = VALUES(created_at),
                    created_by = VALUES(created_by)`,
            [mappedPermissions],
            (error, result) => {
              if (error) {
                callback(error, false, result);
                return;
              }
              callback(null, (result?.affectedRows || 0) > 0, result);
            }
          );
        });
      });
    } catch (error) {
      callback(error, false, []);
    }
  },

  //******** STORE PERMISSION *******************************
  storePermission: (permissionData, callback) => {
    let success = false;
    db.query(
      `INSERT INTO permissions (permission_name, module_id, display_name, status_id, created_at, created_by) VALUES ?`,
      [permissionData],
      (error, result) => {
        if (result) {
          success = true;
        }
        callback(error, success, result);
      }
    );
  },

  //******** FIND PERMISSION *******************************
  findPermission: (id, callback) => {
    let success = false;
    db.query(
      `SELECT p.id,
              p.permission_name,
              p.module_id,
              p.display_name,
              p.status_id,
              p.is_default,
              m.module_name,
              m.display_name AS module_display_name
       FROM permissions p
       LEFT JOIN modules m ON m.id = p.module_id
       WHERE p.id = ?`,
      [id],
      (error, permission = []) => {
        if (permission.length > 0) {
          success = true;
        }
        callback(error, success, permission);
      }
    );
  },

  //******** UPDATE PERMISSION *******************************
  updatePermission: (name, module_id, display, status, is_default, id, callback) => {
    let success = false;
    db.query(
      `UPDATE permissions
       SET permission_name = ?,
           module_id = ?,
           display_name = ?,
           status_id = ?,
           is_default = ?
       WHERE id = ?`,
      [name, module_id, display, status, is_default, id],
      (error, permission) => {
        if (permission) {
          success = true;
        }
        callback(error, success, permission);
      }
    );
  },

  //******** DELETE PERMISSION *******************************
  deletePermission: (id, callback) => {
    let success = false;
    db.query(
      "SELECT COUNT(*) AS num_rows FROM permission_role WHERE permission_id = ?",
      [id],
      (error, result = []) => {
        if (error) {
          callback("Haikuweza kufuta kwa sasa.", false, []);
          return;
        }

        const numRows = Number(result[0]?.num_rows || 0);
        if (numRows > 0) {
          callback(
            `Haujafanikiwa kufuta kwa kuwa permission hii inatumiwa na role ${numRows}`,
            success,
            []
          );
          return;
        }

        db.query(
          `DELETE FROM permissions WHERE id = ?`,
          [id],
          (deleteError, deletedPermission) => {
            if (deleteError) {
              callback("Haikuweza kufuta kuna tatizo", false, []);
              return;
            }
            if (deletedPermission) {
              success = true;
            }
            callback(null, success, deletedPermission);
          }
        );
      }
    );
  },
};
