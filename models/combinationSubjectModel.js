const db = require("../config/database");

const toId = (value) => {
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) && id > 0 ? id : 0;
};

module.exports = {
  //******** GET A LIST OF COMBINATION SUBJECTS *******************************
  getAllCombinationSubjects: (offset, per_page, is_paginated, callback) => {
    const paginated =
      !(is_paginated === false || is_paginated === "false" || is_paginated === 0 || is_paginated === "0");
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

    db.query(
      `SELECT
          cs.id,
          cs.combination_id,
          cs.subject_id,
          c.combination,
          s.subject_name,
          cs.created_at,
          cs.updated_at
        FROM combination_subjects cs
        JOIN combinations c ON c.id = cs.combination_id
        JOIN subjects s ON s.id = cs.subject_id
        ORDER BY cs.id ASC
        ${paginated ? "LIMIT ?,?" : ""}`,
      paginated ? [safeOffset, safePerPage] : [],
      (error, combinationSubjects = []) => {
        if (error) {
          callback(error, [], 0);
          return;
        }

        db.query("SELECT COUNT(*) AS num_rows FROM combination_subjects", (error2, result = []) => {
          if (error2) {
            callback(error2, [], 0);
            return;
          }
          callback(null, combinationSubjects, result[0].num_rows || 0);
        });
      }
    );
  },

  //******** LOOKUP DATA FOR FORM *******************************
  getLookupData: (callback) => {
    db.query(
      `SELECT id, combination
       FROM combinations
       WHERE status_id = 1
       ORDER BY combination ASC`,
      (combinationError, combinations = []) => {
        if (combinationError) {
          callback(combinationError, { combinations: [], subjects: [] });
          return;
        }

        db.query(
          `SELECT id, subject_name
           FROM subjects
           ORDER BY subject_name ASC`,
          (subjectError, subjects = []) => {
            if (subjectError) {
              callback(subjectError, { combinations: [], subjects: [] });
              return;
            }
            callback(null, { combinations, subjects });
          }
        );
      }
    );
  },

  //******** STORE MULTIPLE COMBINATION SUBJECTS *******************************
  storeCombinationSubjects: (data, callback) => {
    const combinationId = toId(data?.combination_id);
    const subjectIds = Array.from(
      new Set(
        (Array.isArray(data?.subject_ids) ? data.subject_ids : [])
          .map((value) => toId(value))
          .filter((id) => id > 0)
      )
    );

    if (!combinationId || subjectIds.length === 0) {
      callback(new Error("Tafadhali chagua Tahasusi na Somo."), false, null, false);
      return;
    }

    db.query(
      `SELECT subject_id
       FROM combination_subjects
       WHERE combination_id = ? AND subject_id IN (?)`,
      [combinationId, subjectIds],
      (existsError, existsRows = []) => {
        if (existsError) {
          callback(existsError, false, null, false);
          return;
        }

        const existingIds = new Set(existsRows.map((row) => toId(row.subject_id)));
        const toInsert = subjectIds.filter((id) => !existingIds.has(id));

        if (toInsert.length === 0) {
          callback(null, false, null, true);
          return;
        }

        const placeholders = toInsert.map(() => "(?, ?, NOW(), NOW())").join(", ");
        const params = [];
        toInsert.forEach((subjectId) => {
          params.push(combinationId, subjectId);
        });

        db.query(
          `INSERT INTO combination_subjects (combination_id, subject_id, created_at, updated_at)
           VALUES ${placeholders}`,
          params,
          (insertError, result) => {
            if (insertError) {
              callback(insertError, false, null, false);
              return;
            }
            callback(
              null,
              result?.affectedRows > 0,
              {
                affectedRows: result?.affectedRows || 0,
                inserted_count: toInsert.length,
                skipped_count: subjectIds.length - toInsert.length,
              },
              false
            );
          }
        );
      }
    );
  },

  // Backward compatibility for single insert
  storeCombinationSubject: (data, callback) => {
    const subjectId = toId(data?.subject_id);
    module.exports.storeCombinationSubjects(
      {
        combination_id: data?.combination_id,
        subject_ids: subjectId > 0 ? [subjectId] : [],
      },
      callback
    );
  },

  //******** FIND COMBINATION SUBJECT *******************************
  findCombinationSubject: (id, callback) => {
    db.query(
      `SELECT
          cs.id,
          cs.combination_id,
          cs.subject_id,
          c.combination,
          s.subject_name,
          cs.created_at,
          cs.updated_at
       FROM combination_subjects cs
       JOIN combinations c ON c.id = cs.combination_id
       JOIN subjects s ON s.id = cs.subject_id
       WHERE cs.id = ?`,
      [id],
      (error, rows = []) => {
        callback(error, !error && rows.length > 0, rows);
      }
    );
  },

  //******** UPDATE COMBINATION SUBJECT *******************************
  updateCombinationSubject: (data, id, callback) => {
    const combinationId = toId(data?.combination_id);
    const subjectId = toId(data?.subject_id);

    if (!combinationId || !subjectId) {
      callback(new Error("Tafadhali chagua Tahasusi na Somo."), false, null, false);
      return;
    }

    db.query(
      `SELECT id
       FROM combination_subjects
       WHERE combination_id = ? AND subject_id = ? AND id <> ?
       LIMIT 1`,
      [combinationId, subjectId, id],
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
          `UPDATE combination_subjects
           SET combination_id = ?, subject_id = ?, updated_at = NOW()
           WHERE id = ?`,
          [combinationId, subjectId, id],
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

  //******** DELETE COMBINATION SUBJECT *******************************
  deleteCombinationSubject: (id, callback) => {
    db.query("DELETE FROM combination_subjects WHERE id = ?", [id], (deleteError, result) => {
      if (deleteError) {
        callback("Haikuweza kufuta kwa sasa.", false, []);
        return;
      }
      callback(null, result?.affectedRows > 0, result);
    });
  },
};
