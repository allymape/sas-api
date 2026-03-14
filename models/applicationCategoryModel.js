const crypto = require("crypto");
const db = require("../config/database");

const normalizeBoolean = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (value === 0 || value === "0" || value === "false") return false;
  if (value === 1 || value === "1" || value === "true") return true;
  return fallback;
};

module.exports = {
  //******** GET A LIST OF APPLICATION CATEGORIES *******************************
  getAllApplicationCategories: (offset, per_page, is_paginated, callback) => {
    const paginated = normalizeBoolean(is_paginated, true);
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

    const listSql = `
      SELECT
        id,
        app_name AS name,
        app_name,
        application_code,
        created_at,
        updated_at
      FROM application_categories
      ORDER BY id ASC
      ${paginated ? "LIMIT ?, ?" : ""}
    `;
    const listParams = paginated ? [safeOffset, safePerPage] : [];

    db.query(listSql, listParams, (error, categories = []) => {
      if (error) {
        console.log("Error", error);
        callback(error, [], 0);
        return;
      }

      db.query("SELECT COUNT(*) AS num_rows FROM application_categories", (error2, result = []) => {
        if (error2) {
          console.log("Error", error2);
          callback(error2, [], 0);
          return;
        }

        const totalRows = result[0]?.num_rows || 0;
        callback(null, categories, totalRows);
      });
    });
  },

  //******** STORE APPLICATION CATEGORY *******************************
  storeApplicationCategory: (data, callback) => {
    const appName = String(data?.app_name || "").trim();
    const applicationCode = String(data?.application_code || "").trim() || null;

    if (!appName) {
      callback(new Error("Aina ya Ombi ni lazima"), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM application_categories WHERE LOWER(app_name) = LOWER(?) LIMIT 1",
      [appName],
      (checkError, existing = []) => {
        if (checkError) {
          console.log("Error", checkError);
          callback(checkError, false, null, false);
          return;
        }

        if (existing.length > 0) {
          callback(null, false, null, true);
          return;
        }

        const secureToken = crypto.randomBytes(24).toString("hex");
        db.query(
          `INSERT INTO application_categories (secure_token, app_name, application_code, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [secureToken, appName, applicationCode],
          (insertError, result) => {
            if (insertError) {
              console.log("Error", insertError);
              callback(insertError, false, null, false);
              return;
            }

            callback(null, result?.affectedRows > 0, result, false);
          }
        );
      }
    );
  },

  //******** FIND APPLICATION CATEGORY *******************************
  findApplicationCategory: (id, callback) => {
    db.query(
      `SELECT id, app_name AS name, app_name, application_code, created_at, updated_at
       FROM application_categories
       WHERE id = ?`,
      [id],
      (error, categories = []) => {
        if (error) {
          console.log("Error", error);
          callback(error, false, []);
          return;
        }

        callback(null, categories.length > 0, categories);
      }
    );
  },

  //******** UPDATE APPLICATION CATEGORY *******************************
  updateApplicationCategory: (data, id, callback) => {
    const appName = String(data?.app_name || "").trim();
    const applicationCode = String(data?.application_code || "").trim() || null;

    if (!appName) {
      callback(new Error("Aina ya Ombi ni lazima"), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM application_categories WHERE LOWER(app_name) = LOWER(?) AND id <> ? LIMIT 1",
      [appName, id],
      (checkError, existing = []) => {
        if (checkError) {
          console.log("Error", checkError);
          callback(checkError, false, null, false);
          return;
        }

        if (existing.length > 0) {
          callback(null, false, null, true);
          return;
        }

        db.query(
          `UPDATE application_categories
           SET app_name = ?, application_code = ?, updated_at = NOW()
           WHERE id = ?`,
          [appName, applicationCode, id],
          (updateError, result) => {
            if (updateError) {
              console.log("Error", updateError);
              callback(updateError, false, null, false);
              return;
            }

            callback(null, result?.affectedRows > 0, result, false);
          }
        );
      }
    );
  },

  //******** DELETE APPLICATION CATEGORY *******************************
  deleteApplicationCategory: (id, callback) => {
    db.query(
      `SELECT
         (SELECT COUNT(*) FROM attachment_types WHERE application_category_id = ?) AS attachment_count,
         (SELECT COUNT(*) FROM applications WHERE application_category_id = ?) AS application_count`,
      [id, id],
      (error, result = []) => {
        if (error) {
          console.log("Error", error);
          callback("Haikuweza kufuta kwa sasa, tafadhali jaribu tena.", false, []);
          return;
        }

        const attachmentCount = Number(result[0]?.attachment_count || 0);
        const applicationCount = Number(result[0]?.application_count || 0);
        const totalUsage = attachmentCount + applicationCount;

        if (totalUsage > 0) {
          callback(
            `Haujafanikiwa kufuta kwa kuwa Aina hii ya Ombi inatumika kwenye kumbukumbu ${totalUsage}.`,
            false,
            []
          );
          return;
        }

        db.query("DELETE FROM application_categories WHERE id = ?", [id], (deleteError, deletedCategory) => {
          if (deleteError) {
            console.log("Error", deleteError);
            callback("Haikuweza kufuta kwa sasa, tafadhali jaribu tena.", false, []);
            return;
          }

          callback(null, deletedCategory?.affectedRows > 0, deletedCategory);
        });
      }
    );
  },
};
