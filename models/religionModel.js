const db = require("../config/database");

const normalizeStatus = (value) => {
  const status = String(value || "")
    .trim()
    .toLowerCase();
  if (!status) return "active";
  return status === "inactive" ? "inactive" : "active";
};

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

const buildFilter = ({ search = "", status = "" } = {}) => {
  const conditions = [];
  const params = [];

  const safeSearch = String(search || "").trim();
  const safeStatus = String(status || "").trim().toLowerCase();

  if (safeSearch) {
    conditions.push("(r.name LIKE ? OR r.code LIKE ?)");
    params.push(`%${safeSearch}%`, `%${safeSearch}%`);
  }

  if (safeStatus) {
    conditions.push("LOWER(r.status) = ?");
    params.push(safeStatus);
  }

  return {
    whereSql: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
};

module.exports = {
  getAllReligions: (offset, per_page, is_paginated, filters, callback) => {
    const { paginated, safePerPage, safeOffset } = getPaging(
      offset,
      per_page,
      is_paginated,
    );
    const { whereSql, params } = buildFilter(filters || {});

    const listSql = `
      SELECT
        r.id,
        r.name,
        r.code,
        r.status,
        r.created_at,
        r.updated_at,
        COUNT(sn.id) AS sect_count
      FROM religions r
      LEFT JOIN sect_names sn ON sn.religion_id = r.id
      ${whereSql}
      GROUP BY r.id
      ORDER BY r.name ASC
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
        `SELECT COUNT(*) AS num_rows FROM religions r ${whereSql}`,
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

  findReligionById: (id, callback) => {
    db.query(
      `
      SELECT
        r.id,
        r.name,
        r.code,
        r.status,
        r.created_at,
        r.updated_at,
        COUNT(sn.id) AS sect_count
      FROM religions r
      LEFT JOIN sect_names sn ON sn.religion_id = r.id
      WHERE r.id = ?
      GROUP BY r.id
      `,
      [id],
      (error, rows = []) => {
        callback(error, !error && rows.length > 0, rows[0] || null);
      },
    );
  },

  createReligion: (payload, callback) => {
    const name = String(payload?.name || "").trim();
    const code = String(payload?.code || "").trim() || null;
    const status = normalizeStatus(payload?.status);

    db.query(
      "SELECT id FROM religions WHERE LOWER(name) = LOWER(?) LIMIT 1",
      [name],
      (nameError, nameRows = []) => {
        if (nameError) {
          callback(nameError, false, null, null);
          return;
        }

        if (nameRows.length > 0) {
          callback(null, false, null, "name");
          return;
        }

        const checkCodeAndInsert = () => {
          db.query(
            `INSERT INTO religions (name, code, status, created_at, updated_at)
             VALUES (?, ?, ?, NOW(), NOW())`,
            [name, code, status],
            (insertError, result) => {
              if (insertError) {
                callback(insertError, false, null, null);
                return;
              }

              callback(null, result?.affectedRows > 0, result, null);
            },
          );
        };

        if (!code) {
          checkCodeAndInsert();
          return;
        }

        db.query(
          "SELECT id FROM religions WHERE LOWER(code) = LOWER(?) LIMIT 1",
          [code],
          (codeError, codeRows = []) => {
            if (codeError) {
              callback(codeError, false, null, null);
              return;
            }

            if (codeRows.length > 0) {
              callback(null, false, null, "code");
              return;
            }

            checkCodeAndInsert();
          },
        );
      },
    );
  },

  updateReligion: (id, payload, callback) => {
    const name = String(payload?.name || "").trim();
    const code = String(payload?.code || "").trim() || null;
    const status = normalizeStatus(payload?.status);

    db.query(
      "SELECT id FROM religions WHERE id = ? LIMIT 1",
      [id],
      (existsError, existsRows = []) => {
        if (existsError) {
          callback(existsError, false, null, null, false);
          return;
        }

        if (existsRows.length === 0) {
          callback(null, false, null, null, true);
          return;
        }

        db.query(
          "SELECT id FROM religions WHERE LOWER(name) = LOWER(?) AND id <> ? LIMIT 1",
          [name, id],
          (nameError, nameRows = []) => {
            if (nameError) {
              callback(nameError, false, null, null, false);
              return;
            }

            if (nameRows.length > 0) {
              callback(null, false, null, "name", false);
              return;
            }

            const runUpdate = () => {
              db.query(
                `UPDATE religions
                 SET name = ?, code = ?, status = ?, updated_at = NOW()
                 WHERE id = ?`,
                [name, code, status, id],
                (updateError, result) => {
                  if (updateError) {
                    callback(updateError, false, null, null, false);
                    return;
                  }

                  callback(null, result?.affectedRows > 0, result, null, false);
                },
              );
            };

            if (!code) {
              runUpdate();
              return;
            }

            db.query(
              "SELECT id FROM religions WHERE LOWER(code) = LOWER(?) AND id <> ? LIMIT 1",
              [code, id],
              (codeError, codeRows = []) => {
                if (codeError) {
                  callback(codeError, false, null, null, false);
                  return;
                }

                if (codeRows.length > 0) {
                  callback(null, false, null, "code", false);
                  return;
                }

                runUpdate();
              },
            );
          },
        );
      },
    );
  },

  deleteReligion: (id, callback) => {
    db.query(
      "SELECT COUNT(*) AS sect_count FROM sect_names WHERE religion_id = ?",
      [id],
      (usageError, usageRows = []) => {
        if (usageError) {
          callback(usageError, false, null, 0, false);
          return;
        }

        const sectCount = Number(usageRows[0]?.sect_count || 0);
        if (sectCount > 0) {
          callback(null, false, null, sectCount, true);
          return;
        }

        db.query(
          "DELETE FROM religions WHERE id = ?",
          [id],
          (deleteError, result) => {
            if (deleteError) {
              callback(deleteError, false, null, 0, false);
              return;
            }
            callback(
              null,
              result?.affectedRows > 0,
              result,
              0,
              false,
              result?.affectedRows === 0,
            );
          },
        );
      },
    );
  },

  getReligionSectNames: (religionId, offset, per_page, is_paginated, search, callback) => {
    const { paginated, safePerPage, safeOffset } = getPaging(
      offset,
      per_page,
      is_paginated,
    );
    const searchValue = String(search || "").trim();
    const whereSearch = searchValue ? " AND sn.word LIKE ?" : "";
    const searchParams = searchValue ? [`%${searchValue}%`] : [];

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
      WHERE sn.religion_id = ?
      ${whereSearch}
      ORDER BY sn.word ASC
      ${paginated ? "LIMIT ?, ?" : ""}
    `;

    const listParams = paginated
      ? [religionId, ...searchParams, safeOffset, safePerPage]
      : [religionId, ...searchParams];

    db.query(listSql, listParams, (error, rows = []) => {
      if (error) {
        callback(error, [], 0);
        return;
      }

      db.query(
        `
        SELECT COUNT(*) AS num_rows
        FROM sect_names sn
        WHERE sn.religion_id = ?
        ${whereSearch}
        `,
        [religionId, ...searchParams],
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

  religionExists: (id, callback) => {
    db.query(
      "SELECT id, name FROM religions WHERE id = ? LIMIT 1",
      [id],
      (error, rows = []) => {
        callback(error, rows[0] || null);
      },
    );
  },
};

