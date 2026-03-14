const db = require("../config/database");

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

const toNullableInteger = (value) => {
  if (value === null || typeof value === "undefined" || value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePayload = (data = {}) => {
  const school_category_id = toNullableId(data.school_category_id);
  const school_sub_category_id = toNullableId(data.school_sub_category_id);
  const education_track = String(data.education_track || "").trim() || null;

  return {
    school_category_id,
    school_sub_category_id,
    education_track,
    min_plot_size_spread_acre: toNullableDecimal(data.min_plot_size_spread_acre),
    min_plot_size_storey_acre: toNullableDecimal(data.min_plot_size_storey_acre),
    max_plot_ratio: toNullableDecimal(data.max_plot_ratio),
    max_built_area_percent: toNullableDecimal(data.max_built_area_percent),
    max_storeys: toNullableInteger(data.max_storeys),
    min_front_setback_m: toNullableDecimal(data.min_front_setback_m),
    min_rear_setback_m: toNullableDecimal(data.min_rear_setback_m),
    min_side_setback_m: toNullableDecimal(data.min_side_setback_m),
    max_students_per_stream: toNullableInteger(data.max_students_per_stream),
    min_streams: toNullableInteger(data.min_streams),
    students_per_single_stream_school: toNullableInteger(data.students_per_single_stream_school),
    max_streams_per_school: toNullableInteger(data.max_streams_per_school),
    max_students_per_class: toNullableInteger(data.max_students_per_class),
    min_total_classes: toNullableInteger(data.min_total_classes),
    max_students_per_school: toNullableInteger(data.max_students_per_school),
    is_active: toBool(data.is_active, true) ? 1 : 0,
  };
};

module.exports = {
  getAllSchoolTypeStandards: (offset, per_page, is_paginated, callback) => {
    const paginated = toBool(is_paginated, true);
    const safePerPage = Number.isFinite(Number(per_page)) && Number(per_page) > 0 ? Number(per_page) : 10;
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Number(offset) : 0;

    db.query(
      `SELECT
          sts.id,
          sts.school_category_id,
          sts.school_sub_category_id,
          sts.education_track,
          sts.min_plot_size_spread_acre,
          sts.min_plot_size_storey_acre,
          sts.max_plot_ratio,
          sts.max_built_area_percent,
          sts.max_storeys,
          sts.min_front_setback_m,
          sts.min_rear_setback_m,
          sts.min_side_setback_m,
          sts.max_students_per_stream,
          sts.min_streams,
          sts.students_per_single_stream_school,
          sts.max_streams_per_school,
          sts.max_students_per_class,
          sts.min_total_classes,
          sts.max_students_per_school,
          sts.is_active,
          sts.created_at,
          sts.updated_at,
          sc.category AS school_category_name,
          ssc.subcategory AS school_sub_category_name
        FROM school_type_standards sts
        JOIN school_categories sc ON sc.id = sts.school_category_id
        LEFT JOIN school_sub_categories ssc ON ssc.id = sts.school_sub_category_id
        ORDER BY sts.id ASC
        ${paginated ? "LIMIT ?, ?" : ""}`,
      paginated ? [safeOffset, safePerPage] : [],
      (error, rows = []) => {
        if (error) {
          callback(error, [], 0);
          return;
        }

        db.query("SELECT COUNT(*) AS num_rows FROM school_type_standards", (countError, countRows = []) => {
          if (countError) {
            callback(countError, [], 0);
            return;
          }
          callback(null, rows, countRows[0]?.num_rows || 0);
        });
      }
    );
  },

  getLookups: (callback) => {
    db.query(
      "SELECT id, category AS name FROM school_categories ORDER BY category ASC",
      (categoryError, categories = []) => {
        if (categoryError) {
          callback(categoryError, null);
          return;
        }

        db.query(
          "SELECT id, subcategory AS name FROM school_sub_categories ORDER BY subcategory ASC",
          (subCategoryError, subCategories = []) => {
            if (subCategoryError) {
              callback(subCategoryError, null);
              return;
            }

            callback(null, {
              school_categories: categories,
              school_sub_categories: subCategories,
            });
          }
        );
      }
    );
  },

  findSchoolTypeStandard: (id, callback) => {
    db.query(
      `SELECT
          id,
          school_category_id,
          school_sub_category_id,
          education_track,
          min_plot_size_spread_acre,
          min_plot_size_storey_acre,
          max_plot_ratio,
          max_built_area_percent,
          max_storeys,
          min_front_setback_m,
          min_rear_setback_m,
          min_side_setback_m,
          max_students_per_stream,
          min_streams,
          students_per_single_stream_school,
          max_streams_per_school,
          max_students_per_class,
          min_total_classes,
          max_students_per_school,
          is_active,
          created_at,
          updated_at
        FROM school_type_standards
        WHERE id = ?`,
      [id],
      (error, rows = []) => {
        callback(error, !error && rows.length > 0, rows);
      }
    );
  },

  storeSchoolTypeStandard: (data, callback) => {
    const payload = normalizePayload(data);

    if (!payload.school_category_id) {
      callback(new Error("Aina ya Shule ni lazima."), false, null, false);
      return;
    }

    db.query(
      `SELECT id
       FROM school_type_standards
       WHERE school_category_id = ?
         AND ((school_sub_category_id IS NULL AND ? IS NULL) OR school_sub_category_id = ?)
         AND COALESCE(education_track, '') = COALESCE(?, '')
       LIMIT 1`,
      [
        payload.school_category_id,
        payload.school_sub_category_id,
        payload.school_sub_category_id,
        payload.education_track,
      ],
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
          `INSERT INTO school_type_standards (
            school_category_id,
            school_sub_category_id,
            education_track,
            min_plot_size_spread_acre,
            min_plot_size_storey_acre,
            max_plot_ratio,
            max_built_area_percent,
            max_storeys,
            min_front_setback_m,
            min_rear_setback_m,
            min_side_setback_m,
            max_students_per_stream,
            min_streams,
            students_per_single_stream_school,
            max_streams_per_school,
            max_students_per_class,
            min_total_classes,
            max_students_per_school,
            is_active,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            payload.school_category_id,
            payload.school_sub_category_id,
            payload.education_track,
            payload.min_plot_size_spread_acre,
            payload.min_plot_size_storey_acre,
            payload.max_plot_ratio,
            payload.max_built_area_percent,
            payload.max_storeys,
            payload.min_front_setback_m,
            payload.min_rear_setback_m,
            payload.min_side_setback_m,
            payload.max_students_per_stream,
            payload.min_streams,
            payload.students_per_single_stream_school,
            payload.max_streams_per_school,
            payload.max_students_per_class,
            payload.min_total_classes,
            payload.max_students_per_school,
            payload.is_active,
          ],
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

  updateSchoolTypeStandard: (data, id, callback) => {
    const payload = normalizePayload(data);

    if (!payload.school_category_id) {
      callback(new Error("Aina ya Shule ni lazima."), false, null, false);
      return;
    }

    db.query(
      `SELECT id
       FROM school_type_standards
       WHERE school_category_id = ?
         AND ((school_sub_category_id IS NULL AND ? IS NULL) OR school_sub_category_id = ?)
         AND COALESCE(education_track, '') = COALESCE(?, '')
         AND id <> ?
       LIMIT 1`,
      [
        payload.school_category_id,
        payload.school_sub_category_id,
        payload.school_sub_category_id,
        payload.education_track,
        id,
      ],
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
          `UPDATE school_type_standards SET
            school_category_id = ?,
            school_sub_category_id = ?,
            education_track = ?,
            min_plot_size_spread_acre = ?,
            min_plot_size_storey_acre = ?,
            max_plot_ratio = ?,
            max_built_area_percent = ?,
            max_storeys = ?,
            min_front_setback_m = ?,
            min_rear_setback_m = ?,
            min_side_setback_m = ?,
            max_students_per_stream = ?,
            min_streams = ?,
            students_per_single_stream_school = ?,
            max_streams_per_school = ?,
            max_students_per_class = ?,
            min_total_classes = ?,
            max_students_per_school = ?,
            is_active = ?,
            updated_at = NOW()
          WHERE id = ?`,
          [
            payload.school_category_id,
            payload.school_sub_category_id,
            payload.education_track,
            payload.min_plot_size_spread_acre,
            payload.min_plot_size_storey_acre,
            payload.max_plot_ratio,
            payload.max_built_area_percent,
            payload.max_storeys,
            payload.min_front_setback_m,
            payload.min_rear_setback_m,
            payload.min_side_setback_m,
            payload.max_students_per_stream,
            payload.min_streams,
            payload.students_per_single_stream_school,
            payload.max_streams_per_school,
            payload.max_students_per_class,
            payload.min_total_classes,
            payload.max_students_per_school,
            payload.is_active,
            id,
          ],
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

  deleteSchoolTypeStandard: (id, callback) => {
    db.query("DELETE FROM school_type_standards WHERE id = ?", [id], (error, result) => {
      if (error) {
        callback("Haikuweza kufuta kwa sasa.", false, []);
        return;
      }
      callback(null, result?.affectedRows > 0, result);
    });
  },
};
