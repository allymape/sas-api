const db = require("../../config/database");
const { notifyLogByEmail } = require("./systemLogAlertService");

const LEVELS = ["critical", "error", "warning", "info", "debug"];

const toNullableInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const toText = (value, fallback = null, maxLength = 0) => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  if (!text) return fallback;
  if (maxLength > 0 && text.length > maxLength) return text.slice(0, maxLength);
  return text;
};

const toJsonText = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

const inferLevel = (level, eventType, statusCode) => {
  const inputLevel = toText(level, "", 20).toLowerCase();
  if (LEVELS.includes(inputLevel)) return inputLevel;

  const parsedStatus = Number(statusCode);
  if (Number.isFinite(parsedStatus) && parsedStatus >= 500) return "critical";
  if (Number.isFinite(parsedStatus) && parsedStatus >= 400) return "error";

  const type = toText(eventType, "", 120).toLowerCase();
  if (/critical|fatal|panic|crash/.test(type)) return "critical";
  if (/warn|missing|validation|not-found/.test(type)) return "warning";
  if (/error|exception|fail/.test(type)) return "error";

  return "info";
};

const getStaffId = (payload = {}) =>
  toNullableInt(
    payload.staff_id ||
      payload.user_id ||
      payload.userId ||
      payload?.req?.user?.id ||
      payload?.req?.user?.user_id ||
      payload?.req?.user?.userId
  );

const getRequestMeta = (req = {}) => ({
  endpoint: toText(req?.originalUrl || req?.url || null, null, 255),
  http_method: toText(req?.method || null, null, 10),
  ip_address: toText(
    req?.headers?.["x-forwarded-for"] ||
      req?.ip ||
      req?.socket?.remoteAddress ||
      null,
    null,
    45
  ),
  user_agent: toText(req?.headers?.["user-agent"] || null, null, 255),
});

const writeSystemLog = (payload = {}, callback = () => {}) => {
  const reqMeta = getRequestMeta(payload.req || {});

  const level = inferLevel(payload.level, payload.event_type, payload.status_code);
  const moduleName = toText(payload.module, "general", 120);
  const eventType = toText(payload.event_type, "unknown", 120);
  const message = toText(payload.message, "No message provided.");

  const params = [
    level,
    moduleName,
    eventType,
    message,
    toText(payload.source, null, 255),
    toNullableInt(payload.application_id),
    toText(payload.tracking_number, null, 60),
    getStaffId(payload),
    toText(payload.endpoint, reqMeta.endpoint, 255),
    toText(payload.http_method, reqMeta.http_method, 10),
    Number.isFinite(Number(payload.status_code))
      ? Number(payload.status_code)
      : null,
    toText(payload.ip_address, reqMeta.ip_address, 45),
    toText(payload.user_agent, reqMeta.user_agent, 255),
    toJsonText(payload.context),
    toJsonText(payload.causes),
    toJsonText(payload.error_details || payload.error),
  ];

  const alertPayload = {
    id: null,
    level,
    module: moduleName,
    event_type: eventType,
    message,
    source: toText(payload.source, null, 255),
    application_id: toNullableInt(payload.application_id),
    tracking_number: toText(payload.tracking_number, null, 60),
    staff_id: getStaffId(payload),
    endpoint: toText(payload.endpoint, reqMeta.endpoint, 255),
    http_method: toText(payload.http_method, reqMeta.http_method, 10),
    status_code: Number.isFinite(Number(payload.status_code))
      ? Number(payload.status_code)
      : null,
    ip_address: toText(payload.ip_address, reqMeta.ip_address, 45),
    context: payload.context ?? null,
    causes: payload.causes ?? null,
    error_details: payload.error_details || payload.error || null,
    created_at: new Date().toISOString(),
  };

  db.query(
    `INSERT INTO system_logs
      (level, module, event_type, message, source, application_id, tracking_number, staff_id,
       endpoint, http_method, status_code, ip_address, user_agent, context_json, causes_json,
       error_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    params,
    (error, result) => {
      if (!error && result?.insertId) {
        alertPayload.id = Number(result.insertId);
      }

      Promise.resolve(notifyLogByEmail(alertPayload)).catch(() => {});

      if (error) {
        console.error("[SYSTEM_LOG][WRITE_ERROR]", {
          message: error?.message || "Unknown DB error while saving system log.",
          code: error?.code || null,
          module: moduleName,
          event_type: eventType,
        });
      }
      callback(error, result || null);
    }
  );
};

module.exports = {
  LEVELS,
  writeSystemLog,
};
