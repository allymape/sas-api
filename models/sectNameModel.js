const db = require("../config/database");

const getPaging = (offset, per_page, is_paginated) => {
  const paginated = !(
    is_paginated === false ||
    is_paginated === "false" ||
    is_paginated === 0 ||
    is_paginated === "0"
  );

  const safePerPage =
    Number.isFinite(Number(per_page)) && Number(per_page) > 0
      ? Number(per_page)
      : 10;
  const safeOffset =
    Number.isFinite(Number(offset)) && Number(offset) >= 0
      ? Number(offset)
      : 0;

  return { paginated, safePerPage, safeOffset };
};

module.exports = {
  getAllSectNames: (offset, per_page, is_paginated, filters, callback) => {
    const { paginated, safePerPage, safeOffset } = getPaging(
      offset,
      per_page,
      is_paginated,
    );

    const religionId = Number(filters?.religion_id || 0) || null;
    const search = String(filters?.search || "").trim();

    const where = [];
    const params = [];

    if (religionId) {
      where.push("sn.religion_id = ?");
      params.push(religionId);
    }

    if (search) {
      where.push("sn.word LIKE ?");
      params.push(`%${search}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const listSql = `
      SELECT
        sn.id,
        sn.word,
        sn.religion_id,
        r.name AS religion_name,
        sn.created_at,
        sn.updated_at
      FROM sect_names sn
      INNER JOIN religions r ON r.id = sn.religion_id
      ${whereSql}
      ORDER BY sn.word ASC
      ${paginated ? "LIMIT ?, ?" : ""}
    `;

    const listParams = paginated
      ? [...params, safeOffset, safePerPage]
      : params;

    db.query(listSql, listParams, (error, rows = []) => {
      if (error) {
        callback(error, [], 0);
        return;
      }

      db.query(
        `
        SELECT COUNT(*) AS num_rows
        FROM sect_names sn
        INNER JOIN religions r ON r.id = sn.religion_id
        ${whereSql}
        `,
        params,
        (countError, countRows = []) => {
          if (countError) {
            callback(countError, [], 0);
            return;
          }
          callback(null, rows, Number(countRows[0]?.num_rows || 0));
        },
      );
    });
  },

  findSectNameById: (id, callback) => {
    db.query(
      `
      SELECT
        sn.id,
        sn.word,
        sn.religion_id,
        r.name AS religion_name,
        sn.created_at,
        sn.updated_at
      FROM sect_names sn
      INNER JOIN religions r ON r.id = sn.religion_id
      WHERE sn.id = ?
      LIMIT 1
      `,
      [id],
      (error, rows = []) => {
        callback(error, !error && rows.length > 0, rows[0] || null);
      },
    );
  },

  createSectName: (payload, callback) => {
    const religionId = Number(payload?.religion_id || 0) || 0;
    const word = String(payload?.word || "").trim();

    db.query(
      "SELECT id FROM religions WHERE id = ? LIMIT 1",
      [religionId],
      (religionError, religionRows = []) => {
        if (religionError) {
          callback(religionError, false, null, null, null);
          return;
        }

        if (religionRows.length === 0) {
          callback(null, false, null, "religion_not_found", null);
          return;
        }

        db.query(
          `SELECT id FROM sect_names
           WHERE religion_id = ? AND LOWER(word) = LOWER(?)
           LIMIT 1`,
          [religionId, word],
          (duplicateError, duplicateRows = []) => {
            if (duplicateError) {
              callback(duplicateError, false, null, null, null);
              return;
            }

            if (duplicateRows.length > 0) {
              callback(null, false, null, "duplicate_word", null);
              return;
            }

            db.query(
              `INSERT INTO sect_names (secure_token, word, religion_id, created_at, updated_at)
               VALUES (SHA2(UUID(), 256), ?, ?, NOW(), NOW())`,
              [word, religionId],
              (insertError, result) => {
                if (insertError) {
                  callback(insertError, false, null, null, null);
                  return;
                }
                callback(null, result?.affectedRows > 0, result, null, null);
              },
            );
          },
        );
      },
    );
  },

  updateSectName: (id, payload, callback) => {
    const religionId = Number(payload?.religion_id || 0) || 0;
    const word = String(payload?.word || "").trim();

    db.query(
      "SELECT id FROM sect_names WHERE id = ? LIMIT 1",
      [id],
      (existsError, existsRows = []) => {
        if (existsError) {
          callback(existsError, false, null, null, false);
          return;
        }

        if (existsRows.length === 0) {
          callback(null, false, null, "not_found", false);
          return;
        }

        db.query(
          "SELECT id FROM religions WHERE id = ? LIMIT 1",
          [religionId],
          (religionError, religionRows = []) => {
            if (religionError) {
              callback(religionError, false, null, null, false);
              return;
            }

            if (religionRows.length === 0) {
              callback(null, false, null, "religion_not_found", false);
              return;
            }

            db.query(
              `SELECT id FROM sect_names
               WHERE religion_id = ? AND LOWER(word) = LOWER(?) AND id <> ?
               LIMIT 1`,
              [religionId, word, id],
              (duplicateError, duplicateRows = []) => {
                if (duplicateError) {
                  callback(duplicateError, false, null, null, false);
                  return;
                }

                if (duplicateRows.length > 0) {
                  callback(null, false, null, "duplicate_word", false);
                  return;
                }

                db.query(
                  `UPDATE sect_names
                   SET word = ?, religion_id = ?, updated_at = NOW()
                   WHERE id = ?`,
                  [word, religionId, id],
                  (updateError, result) => {
                    if (updateError) {
                      callback(updateError, false, null, null, false);
                      return;
                    }
                    callback(null, result?.affectedRows > 0, result, null, false);
                  },
                );
              },
            );
          },
        );
      },
    );
  },

  deleteSectName: (id, callback) => {
    db.query(
      "DELETE FROM sect_names WHERE id = ?",
      [id],
      (deleteError, result) => {
        if (deleteError) {
          callback(deleteError, false, null, false);
          return;
        }
        callback(null, result?.affectedRows > 0, result, result?.affectedRows === 0);
      },
    );
  },
};

