const crypto = require("crypto");
const db = require("../config/database");

module.exports = {
  //******** GET A LIST OF CURRICULA *******************************
  getAllCurricula: (offset, per_page, is_paginated, callback) => {
    const paginated =
      !(is_paginated === false || is_paginated === "false" || is_paginated === 0 || is_paginated === "0");
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

    db.query(
      `SELECT
          id,
          curriculum AS name,
          curriculum,
          created_at,
          updated_at
        FROM curricula
        ORDER BY id ASC
        ${paginated ? "LIMIT ?,?" : ""}`,
      paginated ? [safeOffset, safePerPage] : [],
      (error, curricula = []) => {
        if (error) {
          callback(error, [], 0);
          return;
        }

        db.query(
          "SELECT COUNT(*) AS num_rows FROM curricula",
          (error2, result = []) => {
            if (error2) {
              callback(error2, [], 0);
              return;
            }
            callback(null, curricula, result[0].num_rows || 0);
          }
        );
      }
    );
  },

  //******** STORE CURRICULUM *******************************
  storeCurriculum: (data, callback) => {
    const name = String(data?.name || "").trim();

    if (!name) {
      callback(new Error("Mtaala ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM curricula WHERE LOWER(curriculum) = LOWER(?) LIMIT 1",
      [name],
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
          `INSERT INTO curricula (secure_token, curriculum, created_at, updated_at)
           VALUES (?, ?, NOW(), NOW())`,
          [crypto.randomBytes(24).toString("hex"), name],
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

  //******** FIND CURRICULUM *******************************
  findCurriculum: (id, callback) => {
    db.query(
      `SELECT id, curriculum AS name, curriculum, created_at, updated_at
       FROM curricula
       WHERE id = ?`,
      [id],
      (error, rows = []) => {
        callback(error, !error && rows.length > 0, rows);
      }
    );
  },

  //******** UPDATE CURRICULUM *******************************
  updateCurriculum: (data, id, callback) => {
    const name = String(data?.name || "").trim();

    if (!name) {
      callback(new Error("Mtaala ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM curricula WHERE LOWER(curriculum) = LOWER(?) AND id <> ? LIMIT 1",
      [name, id],
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
          `UPDATE curricula
           SET curriculum = ?, updated_at = NOW()
           WHERE id = ?`,
          [name, id],
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

  //******** DELETE CURRICULUM *******************************
  deleteCurriculum: (id, callback) => {
    db.query(
      `SELECT
         (SELECT COUNT(*) FROM establishing_schools WHERE curriculum_id = ?) AS school_count,
         (SELECT COUNT(*) FROM former_school_infos WHERE curriculum_id = ?) AS former_school_count`,
      [id, id],
      (usageError, usageRows = []) => {
        if (usageError) {
          callback("Haikuweza kufuta kwa sasa.", false, []);
          return;
        }

        const schoolCount = Number(usageRows[0]?.school_count || 0);
        const formerSchoolCount = Number(usageRows[0]?.former_school_count || 0);
        const totalUsage = schoolCount + formerSchoolCount;

        if (totalUsage > 0) {
          callback(
            `Haujafanikiwa kufuta kwa kuwa Mtaala huu unatumika kwenye kumbukumbu ${totalUsage}.`,
            false,
            []
          );
          return;
        }

        db.query("DELETE FROM curricula WHERE id = ?", [id], (deleteError, result) => {
          if (deleteError) {
            callback("Haikuweza kufuta kwa sasa.", false, []);
            return;
          }
          callback(null, result?.affectedRows > 0, result);
        });
      }
    );
  },
};
