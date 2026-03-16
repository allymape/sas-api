const db = require("../config/database");

const toPositiveInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

module.exports = {
  getAllMappings: (offset, per_page, is_paginated, callback) => {
    const paginated =
      !(is_paginated === false || is_paginated === "false" || is_paginated === 0 || is_paginated === "0");
    const safePerPage = toPositiveInt(per_page, 10);
    const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

    db.query(
      `SELECT
          m.id,
          m.registry_type_id,
          rt.registry AS registry_name,
          m.school_category_id,
          sc.category AS school_category_name,
          m.file_number,
          m.is_active,
          m.created_at,
          m.updated_at
        FROM school_file_number_mappings m
        INNER JOIN registry_types rt ON rt.id = m.registry_type_id
        INNER JOIN school_categories sc ON sc.id = m.school_category_id
        ORDER BY m.id ASC
        ${paginated ? "LIMIT ?,?" : ""}`,
      paginated ? [safeOffset, safePerPage] : [],
      (error, rows = []) => {
        if (error) {
          callback(error, [], 0);
          return;
        }

        db.query("SELECT COUNT(*) AS num_rows FROM school_file_number_mappings", (countError, countRows = []) => {
          if (countError) {
            callback(countError, [], 0);
            return;
          }
          callback(null, rows, Number(countRows?.[0]?.num_rows || 0));
        });
      },
    );
  },

  getLookups: (callback) => {
    db.query(
      "SELECT id, registry FROM registry_types ORDER BY registry ASC",
      (registryError, registries = []) => {
        if (registryError) {
          callback(registryError, null);
          return;
        }

        db.query(
          "SELECT id, category FROM school_categories ORDER BY category ASC",
          (categoryError, categories = []) => {
            if (categoryError) {
              callback(categoryError, null);
              return;
            }

            callback(null, { registries, categories });
          },
        );
      },
    );
  },

  findMapping: (id, callback) => {
    db.query(
      `SELECT
          m.id,
          m.registry_type_id,
          rt.registry AS registry_name,
          m.school_category_id,
          sc.category AS school_category_name,
          m.file_number,
          m.is_active,
          m.created_at,
          m.updated_at
        FROM school_file_number_mappings m
        INNER JOIN registry_types rt ON rt.id = m.registry_type_id
        INNER JOIN school_categories sc ON sc.id = m.school_category_id
        WHERE m.id = ?
        LIMIT 1`,
      [id],
      (error, rows = []) => {
        callback(error, !error && rows.length > 0, rows);
      },
    );
  },

  storeMapping: (data, callback) => {
    const registryTypeId = toPositiveInt(data?.registry_type_id, 0);
    const schoolCategoryId = toPositiveInt(data?.school_category_id, 0);
    const fileNumber = String(data?.file_number || "").trim();
    const isActive = Number(data?.is_active) === 0 ? 0 : 1;

    if (!registryTypeId || !schoolCategoryId || !fileNumber) {
      callback(new Error("Tafadhali jaza taarifa zote muhimu."), false, null, false);
      return;
    }

    db.query(
      `SELECT id
       FROM school_file_number_mappings
       WHERE registry_type_id = ? AND school_category_id = ?
       LIMIT 1`,
      [registryTypeId, schoolCategoryId],
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
          `INSERT INTO school_file_number_mappings
            (registry_type_id, school_category_id, file_number, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [registryTypeId, schoolCategoryId, fileNumber, isActive],
          (insertError, result) => {
            if (insertError) {
              callback(insertError, false, null, false);
              return;
            }
            callback(null, result?.affectedRows > 0, result, false);
          },
        );
      },
    );
  },

  updateMapping: (id, data, callback) => {
    const registryTypeId = toPositiveInt(data?.registry_type_id, 0);
    const schoolCategoryId = toPositiveInt(data?.school_category_id, 0);
    const fileNumber = String(data?.file_number || "").trim();
    const isActive = Number(data?.is_active) === 0 ? 0 : 1;

    if (!registryTypeId || !schoolCategoryId || !fileNumber) {
      callback(new Error("Tafadhali jaza taarifa zote muhimu."), false, null, false);
      return;
    }

    db.query(
      `SELECT id
       FROM school_file_number_mappings
       WHERE registry_type_id = ? AND school_category_id = ? AND id <> ?
       LIMIT 1`,
      [registryTypeId, schoolCategoryId, id],
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
          `UPDATE school_file_number_mappings
           SET registry_type_id = ?,
               school_category_id = ?,
               file_number = ?,
               is_active = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [registryTypeId, schoolCategoryId, fileNumber, isActive, id],
          (updateError, result) => {
            if (updateError) {
              callback(updateError, false, null, false);
              return;
            }
            callback(null, result?.affectedRows > 0, result, false);
          },
        );
      },
    );
  },

  deleteMapping: (id, callback) => {
    db.query(
      "DELETE FROM school_file_number_mappings WHERE id = ?",
      [id],
      (error, result) => {
        callback(error, !error && result?.affectedRows > 0, result);
      },
    );
  },
};

