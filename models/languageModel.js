const crypto = require("crypto");
const db = require("../config/database");

const normalizeBoolean = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (value === 0 || value === "0" || value === "false") return false;
  if (value === 1 || value === "1" || value === "true") return true;
  return fallback;
};

const normalizeLanguage = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

module.exports = {
  //******** GET A LIST OF LANGUAGES *******************************
  getAllLanguages: (offset, per_page, is_paginated, search_value, callback) => {
    let search = search_value;
    let done = callback;
    if (typeof search_value === "function") {
      done = search_value;
      search = "";
    }

    const paginated = normalizeBoolean(is_paginated, true);
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;
    const searchText = normalizeLanguage(search);

    const whereSql = searchText ? "WHERE language LIKE ?" : "";
    const whereParams = searchText ? [`%${searchText}%`] : [];

    const listSql = `
      SELECT id, language, created_at, updated_at
      FROM languages
      ${whereSql}
      ORDER BY language ASC, id ASC
      ${paginated ? "LIMIT ?, ?" : ""}
    `;
    const listParams = paginated ? whereParams.concat([safeOffset, safePerPage]) : whereParams;

    db.query(listSql, listParams, (error, languages = []) => {
      if (error) {
        console.log("getAllLanguages error", error);
        done(error, [], 0);
        return;
      }

      db.query(
        `SELECT COUNT(*) AS num_rows FROM languages ${whereSql}`,
        whereParams,
        (countError, countRows = []) => {
          if (countError) {
            console.log("getAllLanguages count error", countError);
            done(countError, [], 0);
            return;
          }
          done(null, languages, Number(countRows[0]?.num_rows || 0));
        },
      );
    });
  },

  //******** FIND LANGUAGE *******************************
  findLanguage: (id, callback) => {
    db.query(
      `SELECT id, language, created_at, updated_at
       FROM languages
       WHERE id = ?
       LIMIT 1`,
      [Number(id || 0)],
      (error, rows = []) => {
        if (error) {
          console.log("findLanguage error", error);
          callback(error, false, []);
          return;
        }
        callback(null, rows.length > 0, rows);
      },
    );
  },

  //******** STORE LANGUAGE *******************************
  storeLanguage: (payload, callback) => {
    const language = normalizeLanguage(payload?.language);
    if (!language) {
      callback(new Error("Lugha ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM languages WHERE LOWER(TRIM(language)) = LOWER(TRIM(?)) LIMIT 1",
      [language],
      (checkError, existing = []) => {
        if (checkError) {
          console.log("storeLanguage duplicate check error", checkError);
          callback(checkError, false, null, false);
          return;
        }

        if (existing.length > 0) {
          callback(null, false, null, true);
          return;
        }

        const secureToken = crypto.randomBytes(24).toString("hex");
        db.query(
          `INSERT INTO languages (secure_token, language, created_at, updated_at)
           VALUES (?, ?, NOW(), NOW())`,
          [secureToken, language],
          (insertError, result) => {
            if (insertError) {
              console.log("storeLanguage insert error", insertError);
              callback(insertError, false, null, false);
              return;
            }
            callback(null, result?.affectedRows > 0, result, false);
          },
        );
      },
    );
  },

  //******** UPDATE LANGUAGE *******************************
  updateLanguage: (payload, id, callback) => {
    const language = normalizeLanguage(payload?.language);
    const languageId = Number(id || 0);

    if (!languageId) {
      callback(new Error("Language id si sahihi."), false, null, false);
      return;
    }
    if (!language) {
      callback(new Error("Lugha ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM languages WHERE LOWER(TRIM(language)) = LOWER(TRIM(?)) AND id <> ? LIMIT 1",
      [language, languageId],
      (checkError, existing = []) => {
        if (checkError) {
          console.log("updateLanguage duplicate check error", checkError);
          callback(checkError, false, null, false);
          return;
        }

        if (existing.length > 0) {
          callback(null, false, null, true);
          return;
        }

        db.query(
          `UPDATE languages
           SET language = ?, updated_at = NOW()
           WHERE id = ?`,
          [language, languageId],
          (updateError, result) => {
            if (updateError) {
              console.log("updateLanguage error", updateError);
              callback(updateError, false, null, false);
              return;
            }
            callback(null, result?.affectedRows > 0, result, false);
          },
        );
      },
    );
  },

  //******** DELETE LANGUAGE *******************************
  deleteLanguage: (id, callback) => {
    const languageId = Number(id || 0);
    if (!languageId) {
      callback("Language id si sahihi.", false, []);
      return;
    }

    db.query(
      `SELECT
         (SELECT COUNT(*) FROM establishing_schools WHERE language_id = ?) AS schools_count,
         (SELECT COUNT(*) FROM former_school_infos WHERE language_id = ?) AS former_schools_count`,
      [languageId, languageId],
      (usageError, usageRows = []) => {
        if (usageError) {
          console.log("deleteLanguage usage check error", usageError);
          callback("Haikuweza kufuta kwa sasa, tafadhali jaribu tena.", false, []);
          return;
        }

        const schoolsCount = Number(usageRows[0]?.schools_count || 0);
        const formerSchoolsCount = Number(usageRows[0]?.former_schools_count || 0);
        const totalUsage = schoolsCount + formerSchoolsCount;

        if (totalUsage > 0) {
          callback(
            `Haujafanikiwa kufuta, Lugha hii inatumika kwenye kumbukumbu ${totalUsage}.`,
            false,
            [],
          );
          return;
        }

        db.query("DELETE FROM languages WHERE id = ?", [languageId], (deleteError, result) => {
          if (deleteError) {
            console.log("deleteLanguage error", deleteError);
            callback("Haikuweza kufuta kwa sasa, tafadhali jaribu tena.", false, []);
            return;
          }
          callback(null, result?.affectedRows > 0, result);
        });
      },
    );
  },
};

