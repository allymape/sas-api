const db = require("../config/database");
const crypto = require("crypto");

module.exports = {
  //******** GET A LIST OF SCHOOL CATEGORIES *******************************
  getAllCategories: (offset, per_page, is_paginated, callback) => {
    const paginated =
      !(is_paginated === false || is_paginated === "false" || is_paginated === 0 || is_paginated === "0");
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

    db.query(
      `SELECT
          id,
          category AS name,
          category,
          code,
          tracking_number_prefix,
          created_at,
          updated_at
        FROM school_categories  
        ORDER BY id ASC
        ${paginated ? "LIMIT ?,?" : ""}`,
      paginated ? [safeOffset, safePerPage] : [],
      (error, categories = []) => {
        if (error) {
          callback(error, [], 0);
          return;
        }
        db.query(
          "SELECT COUNT(*) AS num_rows FROM school_categories",
          (error2, result = []) => {
            if (error2) {
              callback(error2, [], 0);
              return;
            }
            callback(null, categories, result[0].num_rows || 0);
          },
        );
      },
    );
  },

  //******** STORE SCHOOL CATEGORY *******************************
  storeCategory: (data, callback) => {
    const name = String(data?.name || "").trim();
    const code = String(data?.code || "").trim() || null;
    const tracking_number_prefix = String(data?.tracking_number_prefix || "").trim() || null;

    if (!name) {
      callback(new Error("Aina ya Shule ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM school_categories WHERE LOWER(category) = LOWER(?) LIMIT 1",
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
          `INSERT INTO school_categories (code, secure_token, category,tracking_number_prefix, created_at, updated_at)
           VALUES (?, ?, ?,?, NOW(), NOW())`,
          [code, crypto.randomBytes(24).toString("hex"), name,tracking_number_prefix],
          (insertError, result) => {
            if (insertError) {
              callback(insertError, false, null, false);
              return;
            }
            callback(null, result?.affectedRows > 0, result, false);
          },
        );
      }
    );
  },

  //******** FIND SCHOOL CATEGORY *******************************
  findCategory: (id, callback) => {
    db.query(
      `SELECT id, category AS name, category, code, created_at, updated_at
       FROM school_categories
       WHERE id = ?`,
      [id],
      (error, rows = []) => {
        callback(error, !error && rows.length > 0, rows);
      }
    );
  },

  //******** UPDATE SCHOOL CATEGORY *******************************
  updateCategory: (data, id, callback) => {
    const name = String(data?.name || "").trim();
    const code = String(data?.code || "").trim() || null;
    const tracking_number_prefix = String(data?.tracking_number_prefix || "").trim() || null;

    if (!name) {
      callback(new Error("Aina ya Shule ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM school_categories WHERE LOWER(category) = LOWER(?) AND id <> ? LIMIT 1",
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
          `UPDATE school_categories
           SET category = ?, code = ?, tracking_number_prefix = ?, updated_at = NOW()
           WHERE id = ?`,
          [name, code, tracking_number_prefix, id],
          (updateError, result) => {
            if (updateError) {
              callback(updateError, false, null, false);
              return;
            }
            callback(null, result?.affectedRows > 0, result, false);
          },
        );
      }
    );
  },

  //******** DELETE SCHOOL CATEGORY *******************************
  deleteCategory: (id, callback) => {
    db.query(
      `SELECT
         (SELECT COUNT(*) FROM establishing_schools WHERE school_category_id = ?) AS school_count,
         (SELECT COUNT(*) FROM certificate_types WHERE school_category_id = ?) AS certificate_count,
         (SELECT COUNT(*) FROM former_school_infos WHERE school_category_id = ?) AS former_school_count`,
      [id, id, id],
      (usageError, usageRows = []) => {
        if (usageError) {
          callback("Haikuweza kufuta kwa sasa.", false, []);
          return;
        }

        const schoolCount = Number(usageRows[0]?.school_count || 0);
        const certificateCount = Number(usageRows[0]?.certificate_count || 0);
        const formerSchoolCount = Number(usageRows[0]?.former_school_count || 0);
        const totalUsage = schoolCount + certificateCount + formerSchoolCount;

        if (totalUsage > 0) {
          callback(
            `Haujafanikiwa kufuta kwa kuwa Aina hii ya Shule inatumika kwenye kumbukumbu ${totalUsage}.`,
            false,
            []
          );
          return;
        }

        db.query("DELETE FROM school_categories WHERE id = ?", [id], (deleteError, result) => {
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
