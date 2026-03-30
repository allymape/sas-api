// src/Utils/aiSupportContext.js
const { QueryTypes } = require("sequelize");
const { Application } = require("../Models");

const toText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const safeTrim = (value) => toText(value, "").trim();

const redactText = (input) => {
  const text = toText(input, "");
  if (!text) return "";
  return (
    text
      // email
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
      // phone (rough)
      .replace(/\b(\+?255)?0?\d{9}\b/g, "[REDACTED_PHONE]")
      // bearer tokens
      .replace(/\bBearer\s+[A-Za-z0-9._-]+\b/gi, "Bearer [REDACTED_TOKEN]")
      // secure_token / tokens in URLs
      .replace(/secure_token[=:"\s]+[A-Za-z0-9._-]+/gi, 'secure_token="[REDACTED]"')
  );
};

const extractTrackingNumbers = (text) => {
  const value = safeTrim(text);
  if (!value) return [];
  const matches = value.match(/\b[A-Z]{2}-\d{8}-\d+\b/g) || [];
  const unique = [...new Set(matches)].slice(0, 3);
  return unique;
};

const summarizeUser = (user = {}) => {
  const permissions = Array.isArray(user?.userPermissions) ? user.userPermissions : [];
  return {
    id: user?.id || user?.user_id || null,
    name: safeTrim(user?.name),
    username: safeTrim(user?.username || user?.email),
    office: user?.office ?? user?.cheo_office ?? null,
    rank_level: user?.rank_level ?? null,
    zone_id: user?.zone_id ?? user?.zoneId ?? null,
    region_code: safeTrim(user?.region_code || user?.regionCode),
    district_code: safeTrim(user?.district_code || user?.districtCode),
    permissions_count: permissions.length,
    permissions_sample: permissions.slice(0, 30),
  };
};

const getApplicationsByTrackingNumbers = async (trackingNumbers = []) => {
  const list = (Array.isArray(trackingNumbers) ? trackingNumbers : [])
    .map((t) => safeTrim(t))
    .filter(Boolean)
    .slice(0, 3);
  if (!list.length) return [];

  const rows = await Application.sequelize.query(
    `
      SELECT
        a.tracking_number,
        a.application_category_id,
        ac.app_name AS application_category_name,
        a.is_approved,
        a.is_complete,
        a.created_at,
        a.updated_at,
        a.user_id,
        a.staff_id,
        a.registry_type_id,
        a.establishing_school_id,
        e.school_name,
        e.ward_id,
        e.village_id
      FROM applications a
      LEFT JOIN application_categories ac ON ac.id = a.application_category_id
      LEFT JOIN establishing_schools e
        ON e.id = a.establishing_school_id OR e.tracking_number = a.tracking_number
      WHERE a.tracking_number IN (:trackingNumbers)
      LIMIT 3
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { trackingNumbers: list },
    },
  );

  if (!rows.length) return [];

  const processRows = await Application.sequelize.query(
    `
      SELECT ap.tracking_number, ap.workflow_id, ap.step_order, ap.status, ap.assigned_to, ap.started_at, ap.acted_by, ap.acted_at, ap.completed_at
      FROM application_processes ap
      WHERE ap.tracking_number IN (:trackingNumbers)
        AND ap.step_order = (
          SELECT MAX(ap2.step_order)
          FROM application_processes ap2
          WHERE ap2.tracking_number = ap.tracking_number
        )
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { trackingNumbers: list },
    },
  );

  const processByTracking = new Map(processRows.map((r) => [safeTrim(r.tracking_number), r]));

  return rows.map((r) => ({
    ...r,
    latest_process: processByTracking.get(safeTrim(r.tracking_number)) || null,
  }));
};

const getWorkflowStepsForCategory = async (applicationCategoryId) => {
  const id = Number(applicationCategoryId);
  if (!Number.isFinite(id) || id <= 0) return [];

  const sequelize = Application.sequelize;

  const runModernQuery = async () =>
    sequelize.query(
      `
        SELECT
          wf.id,
          wf.application_category_id,
          wf._order,
          wf.unit_id,
          wf.role_id,
          wf.is_start,
          wf.is_final,
          wf.can_assign,
          wf.can_approve,
          wf.can_return
        FROM workflows wf
        WHERE wf.application_category_id = :applicationCategoryId
          AND wf.deleted_at IS NULL
        ORDER BY wf._order ASC
        LIMIT 60
      `,
      { type: QueryTypes.SELECT, replacements: { applicationCategoryId: id } },
    );

  const runLegacyQuery = async () =>
    sequelize.query(
      `
        SELECT
          wf.id,
          wf.application_category_id,
          wf._order,
          wf.start_from AS unit_id,
          NULL AS role_id,
          0 AS is_start,
          0 AS is_final,
          0 AS can_assign,
          0 AS can_approve,
          0 AS can_return
        FROM workflows wf
        WHERE wf.application_category_id = :applicationCategoryId
        ORDER BY wf._order ASC
        LIMIT 60
      `,
      { type: QueryTypes.SELECT, replacements: { applicationCategoryId: id } },
    );

  try {
    return await runModernQuery();
  } catch (error) {
    if (error?.original?.code === "ER_BAD_FIELD_ERROR" || error?.parent?.code === "ER_BAD_FIELD_ERROR") {
      return runLegacyQuery();
    }
    throw error;
  }
};

const buildSupportContext = async ({ req, userMessage }) => {
  const trackingNumbers = extractTrackingNumbers(userMessage);
  const applications = await getApplicationsByTrackingNumbers(trackingNumbers);
  const workflowSteps =
    applications.length && applications[0]?.application_category_id
      ? await getWorkflowStepsForCategory(applications[0].application_category_id)
      : [];

  return {
    now: new Date().toISOString(),
    user: summarizeUser(req?.user || {}),
    request: {
      method: safeTrim(req?.method),
      path: safeTrim(req?.originalUrl),
      ip: safeTrim(req?.ip),
    },
    tracking_numbers: trackingNumbers,
    applications: applications.map((a) => ({
      ...a,
      school_name: safeTrim(a.school_name),
      application_category_name: safeTrim(a.application_category_name),
      latest_process: a.latest_process || null,
    })),
    workflow_steps_sample: workflowSteps,
  };
};

module.exports = {
  redactText,
  extractTrackingNumbers,
  buildSupportContext,
};
