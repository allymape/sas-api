require("dotenv").config();
const express = require("express");
const db = require("../../config/database");
const { isAuth, permission } = require("../../utils");
const {
  VARIABLE_CATALOG,
  TEMPLATE_NOTES,
} = require("../../src/Utils/letterTemplateVariableCatalog");

const letterTemplateRouter = express.Router();

const normalizeKey = (value) => String(value || "").trim();
const normalizeName = (value) => String(value || "").trim();
const normalizeType = (value) => {
  const type = String(value || "").trim().toLowerCase();
  if (!type) return null;
  if (!["meneja", "mmiliki"].includes(type)) return type;
  return type;
};
const toNullableInt = (value) => {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) ? num : null;
};

const toNullableTinyInt = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  const text = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "ndio", "y"].includes(text)) return 1;
  if (["0", "false", "no", "hapana", "n"].includes(text)) return 0;
  const num = Number.parseInt(text, 10);
  if (!Number.isFinite(num)) return null;
  return num ? 1 : 0;
};

const ensureTemplateTables = async () => {
  // No-op: migrations create tables. Router still guards against missing tables.
  return true;
};

const safeDbQuery = async (sql, params = []) => {
  try {
    await ensureTemplateTables();
    const [rows] = await db.promise().query(sql, params);
    return { ok: true, rows };
  } catch (error) {
    if (error && (error.code === "ER_NO_SUCH_TABLE" || error.errno === 1146)) {
      return { ok: false, missingTables: true, error };
    }
    if (error && (error.code === "ER_BAD_FIELD_ERROR" || error.errno === 1054)) {
      return { ok: false, badField: true, error };
    }
    throw error;
  }
};

const latestVersionJoinSql = (includeMeta = true) => `
  SELECT
    t.id,
    t.template_key,
    t.name,
    t.application_category_id,
    ac.app_name AS application_category_name,
    t.letter_type,
    t.is_active,
    t.created_at,
    t.updated_at,
    v.version,
    v.title_template,
    v.body_template${includeMeta ? `,
    v.reference_template,
    v.date_template,
    v.addressee_template,
    v.addressee_template_id` : ``},
    v.created_at AS version_created_at
  FROM letter_templates t
  LEFT JOIN application_categories ac ON ac.id = t.application_category_id
  LEFT JOIN letter_template_versions v
    ON v.letter_template_id = t.id
   AND v.version = (
      SELECT MAX(v2.version)
      FROM letter_template_versions v2
      WHERE v2.letter_template_id = t.id
    )
`;

const looksLikeMissingMetaColumns = (error) => {
  const message = String(error?.sqlMessage || error?.message || "");
  return (
    message.includes("reference_template") ||
    message.includes("date_template") ||
    message.includes("addressee_template") ||
    message.includes("addressee_template_id")
  );
};

const fetchTemplatesWithFallback = async ({ whereSql = "", params = [], limitOne = false } = {}) => {
  const orderSql = limitOne ? " LIMIT 1" : " ORDER BY t.updated_at DESC, t.id DESC";
  const withMetaSql = `${latestVersionJoinSql(true)} ${whereSql} ${orderSql}`.trim();
  const result = await safeDbQuery(withMetaSql, params);
  if (result.ok) return result;

  if (result.badField && looksLikeMissingMetaColumns(result.error)) {
    const withoutMetaSql = `${latestVersionJoinSql(false)} ${whereSql} ${orderSql}`.trim();
    const fallback = await safeDbQuery(withoutMetaSql, params);
    if (!fallback.ok) return fallback;
    const rows = Array.isArray(fallback.rows) ? fallback.rows : [];
    const normalized = rows.map((row) => ({
      ...row,
      reference_template: null,
      date_template: null,
      addressee_template: null,
    }));
    return { ok: true, rows: normalized, metaColumnsMissing: true };
  }

  return result;
};

letterTemplateRouter.get(
  "/letter-templates",
  isAuth,
  permission("view-letters"),
  async (req, res) => {
    const { ok, rows, missingTables, metaColumnsMissing } = await fetchTemplatesWithFallback();

    if (!ok && missingTables) {
      return res.send({ success: true, data: [], message: "Templates table not initialized." });
    }

    return res.send({
      success: true,
      data: rows || [],
      meta_columns_missing: Boolean(metaColumnsMissing),
    });
  }
);

letterTemplateRouter.get(
  "/letter-templates/variables",
  isAuth,
  permission("view-letters"),
  async (_req, res) => {
    return res.send({
      success: true,
      data: {
        notes: TEMPLATE_NOTES,
        variables: VARIABLE_CATALOG,
      },
    });
  }
);

letterTemplateRouter.get(
  "/letter-addressee-templates",
  isAuth,
  permission("view-letters"),
  async (_req, res) => {
    const { ok, rows, missingTables } = await safeDbQuery(
      `SELECT id, template_key, name, address_kind, is_active, updated_at
       FROM letter_addressee_templates
       ORDER BY is_active DESC, updated_at DESC, id DESC`,
      [],
    );
    if (!ok && missingTables) {
      return res.send({ success: true, data: [], message: "Addressee templates table not initialized." });
    }
    return res.send({ success: true, data: rows || [] });
  },
);

letterTemplateRouter.get(
  "/letter-addressee-templates/:id",
  isAuth,
  permission("view-letters"),
  async (req, res) => {
    const id = toNullableInt(req.params.id);
    if (!id) return res.status(400).send({ success: false, message: "Invalid id" });

    const result = await safeDbQuery(
      `SELECT id, template_key, name, address_kind, addressee_template, is_active, created_at, updated_at
       FROM letter_addressee_templates
       WHERE id = ?
       LIMIT 1`,
      [id],
    );

    if (!result.ok && result.missingTables) {
      return res.status(404).send({ success: false, message: "Addressee templates table not initialized." });
    }
    const item = Array.isArray(result.rows) && result.rows.length > 0 ? result.rows[0] : null;
    if (!item) return res.status(404).send({ success: false, message: "Addressee template not found." });
    return res.send({ success: true, data: item });
  },
);

letterTemplateRouter.post(
  "/letter-addressee-templates",
  isAuth,
  permission("view-letters"),
  async (req, res) => {
    const templateKey = normalizeKey(req.body?.template_key);
    const name = normalizeName(req.body?.name);
    const addressKind = String(req.body?.address_kind || "").trim().toLowerCase() || null;
    const addresseeTemplate = String(req.body?.addressee_template || "").trim();
    const isActive = toNullableTinyInt(req.body?.is_active);

    if (!templateKey || !name || !addresseeTemplate) {
      return res.status(400).send({
        success: false,
        message: "template_key, name and addressee_template are required.",
      });
    }

    try {
      await db.promise().query(
        `INSERT INTO letter_addressee_templates (template_key, name, address_kind, addressee_template, is_active, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          templateKey,
          name,
          addressKind,
          addresseeTemplate,
          isActive !== null ? isActive : 1,
          Number(req?.user?.id || 0) || null,
        ],
      );
      return res.send({ success: true, message: "Addressee template created." });
    } catch (error) {
      if (error && (error.code === "ER_NO_SUCH_TABLE" || error.errno === 1146)) {
        return res.status(409).send({ success: false, message: "DB haijasasishwa. Endesha migration kisha jaribu tena." });
      }
      if (error && error.code === "ER_DUP_ENTRY") {
        return res.status(409).send({ success: false, message: "template_key already exists." });
      }
      throw error;
    }
  },
);

letterTemplateRouter.put(
  "/letter-addressee-templates/:id",
  isAuth,
  permission("view-letters"),
  async (req, res) => {
    const id = toNullableInt(req.params.id);
    if (!id) return res.status(400).send({ success: false, message: "Invalid id" });

    const name = normalizeName(req.body?.name);
    const addressKind = String(req.body?.address_kind || "").trim().toLowerCase() || null;
    const addresseeTemplate = String(req.body?.addressee_template || "").trim();
    const isActive = toNullableTinyInt(req.body?.is_active);

    if (!name || !addresseeTemplate) {
      return res.status(400).send({ success: false, message: "name and addressee_template are required." });
    }

    try {
      const [rows] = await db.promise().query(
        `SELECT id FROM letter_addressee_templates WHERE id = ? LIMIT 1`,
        [id],
      );
      const exists = Array.isArray(rows) && rows.length > 0;
      if (!exists) {
        return res.status(404).send({ success: false, message: "Addressee template not found." });
      }

      await db.promise().query(
        `UPDATE letter_addressee_templates
         SET name = ?, address_kind = ?, addressee_template = ?, is_active = ?
         WHERE id = ?`,
        [name, addressKind, addresseeTemplate, isActive !== null ? isActive : 1, id],
      );

      return res.send({ success: true, message: "Addressee template updated." });
    } catch (error) {
      if (error && (error.code === "ER_NO_SUCH_TABLE" || error.errno === 1146)) {
        return res.status(409).send({ success: false, message: "DB haijasasishwa. Endesha migration kisha jaribu tena." });
      }
      throw error;
    }
  },
);

letterTemplateRouter.get(
  "/letter-templates/:template_key",
  isAuth,
  permission("view-letters"),
  async (req, res) => {
    const templateKey = normalizeKey(req.params.template_key);
    if (!templateKey) return res.status(400).send({ success: false, message: "Invalid template_key" });

    const { ok, rows, missingTables, metaColumnsMissing } = await fetchTemplatesWithFallback({
      whereSql: "WHERE t.template_key = ?",
      params: [templateKey],
      limitOne: true,
    });

    if (!ok && missingTables) {
      return res.status(404).send({ success: false, message: "Templates table not initialized." });
    }

    const item = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!item) return res.status(404).send({ success: false, message: "Template not found" });

    return res.send({
      success: true,
      data: item,
      meta_columns_missing: Boolean(metaColumnsMissing),
    });
  }
);

letterTemplateRouter.post(
  "/letter-templates",
  isAuth,
  permission("view-letters"),
  async (req, res) => {
    const templateKey = normalizeKey(req.body?.template_key);
    const name = normalizeName(req.body?.name);
    const applicationCategoryId = toNullableInt(req.body?.application_category_id);
    const letterType = normalizeType(req.body?.letter_type);
    const titleTemplate = String(req.body?.title_template || "").trim();
    const bodyTemplate = String(req.body?.body_template || "").trim();
    const referenceTemplate = String(req.body?.reference_template || "").trim() || null;
    const dateTemplate = String(req.body?.date_template || "").trim() || null;
    const addresseeTemplate = String(req.body?.addressee_template || "").trim() || null;
    const addresseeTemplateId = toNullableInt(req.body?.addressee_template_id);

    if (!templateKey || !name || !titleTemplate || !bodyTemplate) {
      return res.status(400).send({
        success: false,
        message: "template_key, name, title_template and body_template are required.",
      });
    }

    try {
      const [insertTemplate] = await db.promise().query(
        `INSERT INTO letter_templates (template_key, name, application_category_id, letter_type, is_active, created_by)
         VALUES (?, ?, ?, ?, 1, ?)`,
        [
          templateKey,
          name,
          applicationCategoryId,
          letterType,
          Number(req?.user?.id || 0) || null,
        ]
      );

      const templateId = insertTemplate.insertId;

      await db.promise().query(
        `INSERT INTO letter_template_versions (letter_template_id, version, title_template, body_template, reference_template, date_template, addressee_template, addressee_template_id, created_by)
         VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)`,
        [
          templateId,
          titleTemplate,
          bodyTemplate,
          referenceTemplate,
          dateTemplate,
          addresseeTemplate,
          addresseeTemplateId,
          Number(req?.user?.id || 0) || null,
        ]
      );
      return res.send({ success: true, message: "Template created." });
    } catch (error) {
      if (
        (error.code === "ER_BAD_FIELD_ERROR" || error.errno === 1054) &&
        looksLikeMissingMetaColumns(error)
      ) {
        return res.status(409).send({
          success: false,
          message: "DB haijasasishwa kwa meta fields za templates. Endesha migration ya latest kisha jaribu tena.",
        });
      }
      // Best-effort cleanup if version insert fails after template insert.
      if (error && error.code !== "ER_DUP_ENTRY") {
        try {
          await db.promise().query(`DELETE FROM letter_templates WHERE template_key = ?`, [templateKey]);
        } catch (_) {}
      }
      if (error && error.code === "ER_DUP_ENTRY") {
        return res.status(409).send({ success: false, message: "template_key already exists." });
      }
      throw error;
    }
  }
);

letterTemplateRouter.put(
  "/letter-templates/:template_key",
  isAuth,
  permission("view-letters"),
  async (req, res) => {
    const templateKey = normalizeKey(req.params.template_key);
    const name = normalizeName(req.body?.name);
    const applicationCategoryId = toNullableInt(req.body?.application_category_id);
    const letterType = normalizeType(req.body?.letter_type);
    const titleTemplate = String(req.body?.title_template || "").trim();
    const bodyTemplate = String(req.body?.body_template || "").trim();
    const referenceTemplate = String(req.body?.reference_template || "").trim() || null;
    const dateTemplate = String(req.body?.date_template || "").trim() || null;
    const addresseeTemplate = String(req.body?.addressee_template || "").trim() || null;
    const addresseeTemplateId = toNullableInt(req.body?.addressee_template_id);
    const isActive = toNullableTinyInt(req.body?.is_active);

    if (!templateKey) return res.status(400).send({ success: false, message: "Invalid template_key" });
    if (!titleTemplate || !bodyTemplate) {
      return res.status(400).send({ success: false, message: "title_template and body_template are required." });
    }

    try {
      const [existingRows] = await db.promise().query(
        `SELECT id, name, application_category_id, letter_type, is_active
         FROM letter_templates
         WHERE template_key = ?
         LIMIT 1`,
        [templateKey]
      );
      const existing = Array.isArray(existingRows) && existingRows.length > 0 ? existingRows[0] : null;
      if (!existing) {
        return res.status(404).send({ success: false, message: "Template not found." });
      }

      await db.promise().query(
        `UPDATE letter_templates
         SET name = ?, application_category_id = ?, letter_type = ?, is_active = ?
         WHERE id = ?`,
        [
          name || existing.name,
          applicationCategoryId !== null ? applicationCategoryId : existing.application_category_id,
          letterType !== null ? letterType : existing.letter_type,
          isActive !== null ? isActive : (Number(existing?.is_active ?? 1) ? 1 : 0),
          existing.id,
        ]
      );

      const [versionRows] = await db.promise().query(
        `SELECT MAX(version) AS max_version
         FROM letter_template_versions
         WHERE letter_template_id = ?`,
        [existing.id]
      );
      const maxVersion = Number(versionRows?.[0]?.max_version || 0) || 0;
      const nextVersion = maxVersion + 1;

      await db.promise().query(
        `INSERT INTO letter_template_versions (letter_template_id, version, title_template, body_template, reference_template, date_template, addressee_template, addressee_template_id, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          existing.id,
          nextVersion,
          titleTemplate,
          bodyTemplate,
          referenceTemplate,
          dateTemplate,
          addresseeTemplate,
          addresseeTemplateId,
          Number(req?.user?.id || 0) || null,
        ]
      );
      return res.send({ success: true, message: "Template updated.", version: nextVersion });
    } catch (error) {
      if (
        (error.code === "ER_BAD_FIELD_ERROR" || error.errno === 1054) &&
        looksLikeMissingMetaColumns(error)
      ) {
        return res.status(409).send({
          success: false,
          message: "DB haijasasishwa kwa meta fields za templates. Endesha migration ya latest kisha jaribu tena.",
        });
      }
      throw error;
    }
  }
);

module.exports = letterTemplateRouter;
