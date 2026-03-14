const db = require("../config/database");

const normalizeCode = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

module.exports = {
  getAllActionTypes: (offset, per_page, is_paginated, callback) => {
    const paginated =
      !(is_paginated === false || is_paginated === "false" || is_paginated === 0 || is_paginated === "0");
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

    db.query(
      `SELECT
          id,
          code,
          name,
          description,
          created_by,
          updated_by,
          created_at,
          updated_at
        FROM action_types
        WHERE deleted_at IS NULL
        ORDER BY id ASC
        ${paginated ? "LIMIT ?,?" : ""}`,
      paginated ? [safeOffset, safePerPage] : [],
      (error, actionTypes = []) => {
        if (error) {
          callback(error, [], 0);
          return;
        }

        db.query(
          "SELECT COUNT(*) AS num_rows FROM action_types WHERE deleted_at IS NULL",
          (error2, result = []) => {
            if (error2) {
              callback(error2, [], 0);
              return;
            }
            callback(null, actionTypes, result[0]?.num_rows || 0);
          }
        );
      }
    );
  },

  lookupActionTypes: (callback) => {
    db.query(
      `SELECT id, code, name, description
       FROM action_types
       WHERE deleted_at IS NULL
       ORDER BY name ASC`,
      (error, actionTypes = []) => {
        callback(error, actionTypes);
      }
    );
  },

  storeActionType: (data, actorId, callback) => {
    const name = String(data?.name || "").trim();
    const code = normalizeCode(data?.code);
    const description = String(data?.description || "").trim() || null;

    if (!name || !code) {
      callback(new Error("Jina na code ni lazima."), false, null, false);
      return;
    }

    db.query(
      `SELECT id
       FROM action_types
       WHERE LOWER(code) = LOWER(?) AND deleted_at IS NULL
       LIMIT 1`,
      [code],
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
          `INSERT INTO action_types
            (code, name, description, created_by, updated_by, created_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NULL)`,
          [code, name, description, actorId || null, actorId || null],
          (insertError, result) => {
            if (insertError) {
              if (insertError.code === "ER_DUP_ENTRY") {
                callback(null, false, null, true);
                return;
              }
              callback(insertError, false, null, false);
              return;
            }
            callback(null, result?.affectedRows > 0, result, false);
          }
        );
      }
    );
  },

  findActionType: (id, callback) => {
    db.query(
      `SELECT
          id,
          code,
          name,
          description,
          created_by,
          updated_by,
          created_at,
          updated_at
       FROM action_types
       WHERE id = ? AND deleted_at IS NULL`,
      [id],
      (error, rows = []) => {
        callback(error, !error && rows.length > 0, rows);
      }
    );
  },

  updateActionType: (data, id, actorId, callback) => {
    const name = String(data?.name || "").trim();
    const code = normalizeCode(data?.code);
    const description = String(data?.description || "").trim() || null;

    if (!name || !code) {
      callback(new Error("Jina na code ni lazima."), false, null, false);
      return;
    }

    db.query(
      `SELECT id
       FROM action_types
       WHERE LOWER(code) = LOWER(?) AND id <> ? AND deleted_at IS NULL
       LIMIT 1`,
      [code, id],
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
          `UPDATE action_types
           SET code = ?,
               name = ?,
               description = ?,
               updated_by = ?,
               updated_at = NOW()
           WHERE id = ? AND deleted_at IS NULL`,
          [code, name, description, actorId || null, id],
          (updateError, result) => {
            if (updateError) {
              if (updateError.code === "ER_DUP_ENTRY") {
                callback(null, false, null, true);
                return;
              }
              callback(updateError, false, null, false);
              return;
            }
            callback(null, result?.affectedRows > 0, result, false);
          }
        );
      }
    );
  },

  deleteActionType: (id, actorId, callback) => {
    db.query(
      `UPDATE action_types
       SET deleted_at = NOW(),
           updated_at = NOW(),
           updated_by = ?
       WHERE id = ? AND deleted_at IS NULL`,
      [actorId || null, id],
      (error, result) => {
        if (error) {
          callback("Haikuweza kufuta kwa sasa.", false, []);
          return;
        }
        callback(null, result?.affectedRows > 0, result);
      }
    );
  },
};
