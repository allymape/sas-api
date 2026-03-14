const db = require("../config/database");

const STREAM_BANDS = ["single_stream", "multiple_stream"];

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (error, rows = []) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows);
    });
  });

const toBool = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (value === 0 || value === "0" || value === "false") return false;
  if (value === 1 || value === "1" || value === "true") return true;
  return fallback;
};

const toNullableId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const toNullableDecimal = (value) => {
  if (value === null || typeof value === "undefined" || value === "") return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeStandardPayload = (data = {}) => {
  const streamBand = String(data.stream_band || "").trim();
  return {
    school_category_id: toNullableId(data.school_category_id),
    school_sub_category_id: toNullableId(data.school_sub_category_id),
    school_specialization_id: toNullableId(data.school_specialization_id),
    school_gender_type_id: toNullableId(data.school_gender_type_id),
    stream_band: STREAM_BANDS.includes(streamBand) ? streamBand : null,
    infrastructure_item_id: toNullableId(data.infrastructure_item_id),
    required_quantity: toNullableDecimal(data.required_quantity),
    notes: String(data.notes || "").trim() || null,
    is_active: toBool(data.is_active, true) ? 1 : 0,
  };
};

const normalizeItemPayload = (data = {}) => ({
  code: String(data.code || "").trim(),
  name: String(data.name || "").trim(),
  group_name: String(data.group_name || "").trim() || null,
  unit: String(data.unit || "").trim() || "count",
  description: String(data.description || "").trim() || null,
  is_active: toBool(data.is_active, true) ? 1 : 0,
});

module.exports = {
  getLookups: async (callback) => {
    try {
      const [
        school_categories,
        school_sub_categories,
        school_specializations,
        school_gender_types,
        infrastructure_items,
      ] = await Promise.all([
        query("SELECT id, category AS name FROM school_categories ORDER BY category ASC"),
        query("SELECT id, subcategory AS name FROM school_sub_categories ORDER BY subcategory ASC"),
        query("SELECT id, specialization AS name FROM school_specializations ORDER BY specialization ASC"),
        query("SELECT id, gender_type AS name FROM school_gender_types ORDER BY gender_type ASC"),
        query("SELECT id, code, name, group_name, unit, is_active FROM infrastructure_items ORDER BY name ASC"),
      ]);

      callback(null, {
        school_categories,
        school_sub_categories,
        school_specializations,
        school_gender_types,
        infrastructure_items,
        stream_bands: STREAM_BANDS,
      });
    } catch (error) {
      callback(error, null);
    }
  },

  getAllStandards: async (offset, per_page, is_paginated, callback) => {
    const paginated = toBool(is_paginated, true);
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

    try {
      const rows = await query(
        `SELECT
            sis.id,
            sis.school_category_id,
            sis.school_sub_category_id,
            sis.school_specialization_id,
            sis.school_gender_type_id,
            sis.stream_band,
            sis.infrastructure_item_id,
            sis.required_quantity,
            sis.notes,
            sis.is_active,
            sis.created_at,
            sis.updated_at,
            sc.category AS school_category_name,
            ssc.subcategory AS school_sub_category_name,
            ss.specialization AS school_specialization_name,
            sgt.gender_type AS school_gender_type_name,
            ii.code AS infrastructure_item_code,
            ii.name AS infrastructure_item_name,
            ii.group_name AS infrastructure_item_group,
            ii.unit AS infrastructure_item_unit
          FROM school_infrastructure_standards sis
          JOIN school_categories sc ON sc.id = sis.school_category_id
          LEFT JOIN school_sub_categories ssc ON ssc.id = sis.school_sub_category_id
          LEFT JOIN school_specializations ss ON ss.id = sis.school_specialization_id
          LEFT JOIN school_gender_types sgt ON sgt.id = sis.school_gender_type_id
          JOIN infrastructure_items ii ON ii.id = sis.infrastructure_item_id
          ORDER BY sis.id ASC
          ${paginated ? "LIMIT ?, ?" : ""}`,
        paginated ? [safeOffset, safePerPage] : []
      );

      const countRows = await query("SELECT COUNT(*) AS num_rows FROM school_infrastructure_standards");
      callback(null, rows, countRows[0]?.num_rows || 0);
    } catch (error) {
      callback(error, [], 0);
    }
  },

  findStandard: async (id, callback) => {
    try {
      const rows = await query(
        `SELECT
            id,
            school_category_id,
            school_sub_category_id,
            school_specialization_id,
            school_gender_type_id,
            stream_band,
            infrastructure_item_id,
            required_quantity,
            notes,
            is_active,
            created_at,
            updated_at
          FROM school_infrastructure_standards
          WHERE id = ?`,
        [id]
      );
      callback(null, rows.length > 0, rows);
    } catch (error) {
      callback(error, false, []);
    }
  },

  storeStandard: async (data, callback) => {
    const payload = normalizeStandardPayload(data);

    if (!payload.school_category_id) {
      callback(new Error("Aina ya Shule ni lazima."), false, null, false);
      return;
    }

    if (!payload.stream_band) {
      callback(new Error("Band ya mkondo ni lazima."), false, null, false);
      return;
    }

    if (!payload.infrastructure_item_id) {
      callback(new Error("Kipengele cha miundombinu ni lazima."), false, null, false);
      return;
    }

    if (payload.required_quantity === null) {
      callback(new Error("Idadi inayotakiwa ni lazima."), false, null, false);
      return;
    }

    try {
      const existsRows = await query(
        `SELECT id
         FROM school_infrastructure_standards
         WHERE school_category_id = ?
           AND ((school_sub_category_id IS NULL AND ? IS NULL) OR school_sub_category_id = ?)
           AND ((school_specialization_id IS NULL AND ? IS NULL) OR school_specialization_id = ?)
           AND ((school_gender_type_id IS NULL AND ? IS NULL) OR school_gender_type_id = ?)
           AND stream_band = ?
           AND infrastructure_item_id = ?
         LIMIT 1`,
        [
          payload.school_category_id,
          payload.school_sub_category_id,
          payload.school_sub_category_id,
          payload.school_specialization_id,
          payload.school_specialization_id,
          payload.school_gender_type_id,
          payload.school_gender_type_id,
          payload.stream_band,
          payload.infrastructure_item_id,
        ]
      );

      if (existsRows.length > 0) {
        callback(null, false, null, true);
        return;
      }

      const result = await query(
        `INSERT INTO school_infrastructure_standards (
            school_category_id,
            school_sub_category_id,
            school_specialization_id,
            school_gender_type_id,
            stream_band,
            infrastructure_item_id,
            required_quantity,
            notes,
            is_active,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          payload.school_category_id,
          payload.school_sub_category_id,
          payload.school_specialization_id,
          payload.school_gender_type_id,
          payload.stream_band,
          payload.infrastructure_item_id,
          payload.required_quantity,
          payload.notes,
          payload.is_active,
        ]
      );

      callback(null, result?.affectedRows > 0, result, false);
    } catch (error) {
      callback(error, false, null, false);
    }
  },

  updateStandard: async (data, id, callback) => {
    const payload = normalizeStandardPayload(data);

    if (!payload.school_category_id) {
      callback(new Error("Aina ya Shule ni lazima."), false, null, false);
      return;
    }

    if (!payload.stream_band) {
      callback(new Error("Band ya mkondo ni lazima."), false, null, false);
      return;
    }

    if (!payload.infrastructure_item_id) {
      callback(new Error("Kipengele cha miundombinu ni lazima."), false, null, false);
      return;
    }

    if (payload.required_quantity === null) {
      callback(new Error("Idadi inayotakiwa ni lazima."), false, null, false);
      return;
    }

    try {
      const existsRows = await query(
        `SELECT id
         FROM school_infrastructure_standards
         WHERE school_category_id = ?
           AND ((school_sub_category_id IS NULL AND ? IS NULL) OR school_sub_category_id = ?)
           AND ((school_specialization_id IS NULL AND ? IS NULL) OR school_specialization_id = ?)
           AND ((school_gender_type_id IS NULL AND ? IS NULL) OR school_gender_type_id = ?)
           AND stream_band = ?
           AND infrastructure_item_id = ?
           AND id <> ?
         LIMIT 1`,
        [
          payload.school_category_id,
          payload.school_sub_category_id,
          payload.school_sub_category_id,
          payload.school_specialization_id,
          payload.school_specialization_id,
          payload.school_gender_type_id,
          payload.school_gender_type_id,
          payload.stream_band,
          payload.infrastructure_item_id,
          id,
        ]
      );

      if (existsRows.length > 0) {
        callback(null, false, null, true);
        return;
      }

      const result = await query(
        `UPDATE school_infrastructure_standards SET
            school_category_id = ?,
            school_sub_category_id = ?,
            school_specialization_id = ?,
            school_gender_type_id = ?,
            stream_band = ?,
            infrastructure_item_id = ?,
            required_quantity = ?,
            notes = ?,
            is_active = ?,
            updated_at = NOW()
          WHERE id = ?`,
        [
          payload.school_category_id,
          payload.school_sub_category_id,
          payload.school_specialization_id,
          payload.school_gender_type_id,
          payload.stream_band,
          payload.infrastructure_item_id,
          payload.required_quantity,
          payload.notes,
          payload.is_active,
          id,
        ]
      );

      callback(null, result?.affectedRows > 0, result, false);
    } catch (error) {
      callback(error, false, null, false);
    }
  },

  deleteStandard: async (id, callback) => {
    try {
      const result = await query("DELETE FROM school_infrastructure_standards WHERE id = ?", [id]);
      callback(null, result?.affectedRows > 0, result);
    } catch (error) {
      callback("Haikuweza kufuta kwa sasa.", false, []);
    }
  },

  getAllInfrastructureItems: async (offset, per_page, is_paginated, callback) => {
    const paginated = toBool(is_paginated, true);
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

    try {
      const rows = await query(
        `SELECT
            id,
            code,
            name,
            group_name,
            unit,
            description,
            is_active,
            created_at,
            updated_at
          FROM infrastructure_items
          ORDER BY id ASC
          ${paginated ? "LIMIT ?, ?" : ""}`,
        paginated ? [safeOffset, safePerPage] : []
      );

      const countRows = await query("SELECT COUNT(*) AS num_rows FROM infrastructure_items");
      callback(null, rows, countRows[0]?.num_rows || 0);
    } catch (error) {
      callback(error, [], 0);
    }
  },

  findInfrastructureItem: async (id, callback) => {
    try {
      const rows = await query(
        `SELECT
            id,
            code,
            name,
            group_name,
            unit,
            description,
            is_active,
            created_at,
            updated_at
          FROM infrastructure_items
          WHERE id = ?`,
        [id]
      );

      callback(null, rows.length > 0, rows);
    } catch (error) {
      callback(error, false, []);
    }
  },

  storeInfrastructureItem: async (data, callback) => {
    const payload = normalizeItemPayload(data);

    if (!payload.code) {
      callback(new Error("Code ni lazima."), false, null, false);
      return;
    }

    if (!payload.name) {
      callback(new Error("Jina la kipengele ni lazima."), false, null, false);
      return;
    }

    try {
      const existsRows = await query(
        `SELECT id
         FROM infrastructure_items
         WHERE LOWER(code) = LOWER(?) OR LOWER(name) = LOWER(?)
         LIMIT 1`,
        [payload.code, payload.name]
      );

      if (existsRows.length > 0) {
        callback(null, false, null, true);
        return;
      }

      const result = await query(
        `INSERT INTO infrastructure_items (
            code,
            name,
            group_name,
            unit,
            description,
            is_active,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          payload.code,
          payload.name,
          payload.group_name,
          payload.unit,
          payload.description,
          payload.is_active,
        ]
      );

      callback(null, result?.affectedRows > 0, result, false);
    } catch (error) {
      callback(error, false, null, false);
    }
  },

  updateInfrastructureItem: async (data, id, callback) => {
    const payload = normalizeItemPayload(data);

    if (!payload.code) {
      callback(new Error("Code ni lazima."), false, null, false);
      return;
    }

    if (!payload.name) {
      callback(new Error("Jina la kipengele ni lazima."), false, null, false);
      return;
    }

    try {
      const existsRows = await query(
        `SELECT id
         FROM infrastructure_items
         WHERE (LOWER(code) = LOWER(?) OR LOWER(name) = LOWER(?))
           AND id <> ?
         LIMIT 1`,
        [payload.code, payload.name, id]
      );

      if (existsRows.length > 0) {
        callback(null, false, null, true);
        return;
      }

      const result = await query(
        `UPDATE infrastructure_items SET
            code = ?,
            name = ?,
            group_name = ?,
            unit = ?,
            description = ?,
            is_active = ?,
            updated_at = NOW()
          WHERE id = ?`,
        [
          payload.code,
          payload.name,
          payload.group_name,
          payload.unit,
          payload.description,
          payload.is_active,
          id,
        ]
      );

      callback(null, result?.affectedRows > 0, result, false);
    } catch (error) {
      callback(error, false, null, false);
    }
  },

  deleteInfrastructureItem: async (id, callback) => {
    try {
      const usageRows = await query(
        "SELECT COUNT(*) AS usage_count FROM school_infrastructure_standards WHERE infrastructure_item_id = ?",
        [id]
      );
      const usageCount = Number(usageRows[0]?.usage_count || 0);

      if (usageCount > 0) {
        callback(
          `Haujafanikiwa kufuta kwa kuwa kipengele hiki kinatumika kwenye viwango ${usageCount}.`,
          false,
          []
        );
        return;
      }

      const result = await query("DELETE FROM infrastructure_items WHERE id = ?", [id]);
      callback(null, result?.affectedRows > 0, result);
    } catch (error) {
      callback("Haikuweza kufuta kwa sasa.", false, []);
    }
  },
};
