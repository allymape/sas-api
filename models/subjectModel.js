const db = require("../config/database");

module.exports = {
  //******** GET A LIST OF SUBJECTS *******************************
  getAllSubjects: (offset, per_page, is_paginated, callback) => {
    const paginated =
      !(is_paginated === false || is_paginated === "false" || is_paginated === 0 || is_paginated === "0");
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

    db.query(
      `SELECT
          id,
          subject_name AS name,
          subject_name,
          created_at,
          updated_at
        FROM subjects
        ORDER BY id ASC
        ${paginated ? "LIMIT ?,?" : ""}`,
      paginated ? [safeOffset, safePerPage] : [],
      (error, subjects = []) => {
        if (error) {
          callback(error, [], 0);
          return;
        }

        db.query("SELECT COUNT(*) AS num_rows FROM subjects", (error2, result = []) => {
          if (error2) {
            callback(error2, [], 0);
            return;
          }
          callback(null, subjects, result[0].num_rows || 0);
        });
      }
    );
  },

  //******** STORE SUBJECT *******************************
  storeSubject: (data, callback) => {
    const name = String(data?.name || "").trim();
    if (!name) {
      callback(new Error("Somo ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM subjects WHERE LOWER(subject_name) = LOWER(?) LIMIT 1",
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
          `INSERT INTO subjects (subject_name, created_at, updated_at)
           VALUES (?, NOW(), NOW())`,
          [name],
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

  //******** FIND SUBJECT *******************************
  findSubject: (id, callback) => {
    db.query(
      `SELECT id, subject_name AS name, subject_name, created_at, updated_at
       FROM subjects
       WHERE id = ?`,
      [id],
      (error, rows = []) => {
        callback(error, !error && rows.length > 0, rows);
      }
    );
  },

  //******** UPDATE SUBJECT *******************************
  updateSubject: (data, id, callback) => {
    const name = String(data?.name || "").trim();
    if (!name) {
      callback(new Error("Somo ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM subjects WHERE LOWER(subject_name) = LOWER(?) AND id <> ? LIMIT 1",
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
          `UPDATE subjects
           SET subject_name = ?, updated_at = NOW()
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

  //******** DELETE SUBJECT *******************************
  deleteSubject: (id, callback) => {
    db.query(
      "SELECT COUNT(*) AS num_rows FROM combination_subjects WHERE subject_id = ?",
      [id],
      (usageError, usageRows = []) => {
        if (usageError) {
          callback("Haikuweza kufuta kwa sasa.", false, []);
          return;
        }

        const usage = Number(usageRows[0]?.num_rows || 0);
        if (usage > 0) {
          callback(`Haujafanikiwa kufuta kwa kuwa Somo hili linatumika kwenye kumbukumbu ${usage}.`, false, []);
          return;
        }

        db.query("DELETE FROM subjects WHERE id = ?", [id], (deleteError, result) => {
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
