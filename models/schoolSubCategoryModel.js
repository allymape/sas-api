const crypto = require("crypto");
const db = require("../config/database");

module.exports = {
  //******** GET A LIST OF SCHOOL SUB CATEGORIES *******************************
  getAllSubCategories: (offset, per_page, is_paginated, callback) => {
    const paginated =
      !(is_paginated === false || is_paginated === "false" || is_paginated === 0 || is_paginated === "0");
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

    db.query(
      `SELECT
          id,
          subcategory AS name,
          subcategory,
          code,
          created_at,
          updated_at
        FROM school_sub_categories
        ORDER BY id ASC
        ${paginated ? "LIMIT ?,?" : ""}`,
      paginated ? [safeOffset, safePerPage] : [],
      (error, subCategories = []) => {
        if (error) {
          callback(error, [], 0);
          return;
        }

        db.query(
          "SELECT COUNT(*) AS num_rows FROM school_sub_categories",
          (error2, result = []) => {
            if (error2) {
              callback(error2, [], 0);
              return;
            }
            callback(null, subCategories, result[0].num_rows || 0);
          }
        );
      }
    );
  },

  //******** STORE SCHOOL SUB CATEGORY *******************************
  storeSubCategory: (data, callback) => {
    const name = String(data?.name || "").trim();
    const code = String(data?.code || "").trim() || null;

    if (!name) {
      callback(new Error("Aina ya Malazi ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM school_sub_categories WHERE LOWER(subcategory) = LOWER(?) LIMIT 1",
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
          `INSERT INTO school_sub_categories (secure_token, subcategory, code, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), NOW())`,
          [crypto.randomBytes(24).toString("hex"), name, code],
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

  //******** FIND SCHOOL SUB CATEGORY *******************************
  findSubCategory: (id, callback) => {
    db.query(
      `SELECT id, subcategory AS name, subcategory, code, created_at, updated_at
       FROM school_sub_categories
       WHERE id = ?`,
      [id],
      (error, rows = []) => {
        callback(error, !error && rows.length > 0, rows);
      }
    );
  },

  //******** UPDATE SCHOOL SUB CATEGORY *******************************
  updateSubCategory: (data, id, callback) => {
    const name = String(data?.name || "").trim();
    const code = String(data?.code || "").trim() || null;

    if (!name) {
      callback(new Error("Aina ya Malazi ni lazima."), false, null, false);
      return;
    }

    db.query(
      "SELECT id FROM school_sub_categories WHERE LOWER(subcategory) = LOWER(?) AND id <> ? LIMIT 1",
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
          `UPDATE school_sub_categories
           SET subcategory = ?, code = ?, updated_at = NOW()
           WHERE id = ?`,
          [name, code, id],
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

  //******** DELETE SCHOOL SUB CATEGORY *******************************
  deleteSubCategory: (id, callback) => {
    db.query(
      `SELECT
         (SELECT COUNT(*) FROM establishing_schools WHERE school_sub_category_id = ?) AS school_count,
         (SELECT COUNT(*) FROM former_school_infos WHERE school_sub_category_id = ?) AS former_school_count`,
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
            `Haujafanikiwa kufuta kwa kuwa Aina hii ya Malazi inatumika kwenye kumbukumbu ${totalUsage}.`,
            false,
            []
          );
          return;
        }

        db.query("DELETE FROM school_sub_categories WHERE id = ?", [id], (deleteError, result) => {
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
