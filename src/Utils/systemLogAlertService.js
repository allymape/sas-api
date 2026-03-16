require("dotenv").config();
const nodemailer = require("nodemailer");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_ALERT_LEVELS = ["critical"];
const DEFAULT_COOLDOWN_MS = 120000;
const SECRET_KEY_PATTERN = /(pass|password|pwd|secret|token|authorization|cookie|jwt|api[_-]?key|private[_-]?key|client[_-]?secret|credential)/i;

let transporter = null;
let transporterKey = "";
const recentAlerts = new Map();

const toText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
};

const toPositiveInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseEmails = (value = "") =>
  String(value || "")
    .split(/[,\s;]+/)
    .map((item) => item.trim())
    .filter((item) => EMAIL_PATTERN.test(item));

const parseLevels = (value = "") => {
  const levels = String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const unique = [...new Set(levels)];
  return unique.length > 0 ? unique : DEFAULT_ALERT_LEVELS;
};

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const prettyJson = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
};

const redactSensitive = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (value && typeof value === "object") {
    const next = {};
    for (const [key, itemValue] of Object.entries(value)) {
      if (SECRET_KEY_PATTERN.test(String(key || ""))) {
        next[key] = "******";
      } else {
        next[key] = redactSensitive(itemValue);
      }
    }
    return next;
  }

  return value;
};

const buildAlertConfig = () => {
  const host = toText(process.env.MAIL_HOST, "");
  const port = toPositiveInt(process.env.MAIL_PORT, 465);
  const user = toText(process.env.MAIL_USER, "");
  const pass = toText(process.env.MAIL_PASS, "");

  const primaryTo =
    process.env.SYSTEM_LOG_ALERT_TO ||
    process.env.ADMIN_EMAIL ||
    process.env.SYSTEM_ADMIN_EMAIL ||
    "";

  return {
    enabled: toBool(process.env.SYSTEM_LOG_ALERT_ENABLED, true),
    levels: parseLevels(process.env.SYSTEM_LOG_ALERT_LEVELS || "critical"),
    to: parseEmails(primaryTo),
    cc: parseEmails(process.env.SYSTEM_LOG_ALERT_CC || ""),
    bcc: parseEmails(process.env.SYSTEM_LOG_ALERT_BCC || ""),
    from: toText(
      process.env.SYSTEM_LOG_ALERT_FROM,
      process.env.MAIL_FROM || '"SAS Administration" <noreply@moe.go.tz>'
    ),
    subjectPrefix: toText(process.env.SYSTEM_LOG_ALERT_SUBJECT_PREFIX, "[SAS ALERT]"),
    cooldownMs: toPositiveInt(process.env.SYSTEM_LOG_ALERT_COOLDOWN_MS, DEFAULT_COOLDOWN_MS),
    host,
    port,
    secure: toBool(
      process.env.MAIL_SECURE,
      String(port) === "465"
    ),
    user,
    pass,
  };
};

const buildTransporter = (config) => {
  const key = [config.host, config.port, config.user, config.pass, config.secure].join("|");
  if (transporter && transporterKey === key) return transporter;

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  transporterKey = key;
  return transporter;
};

const shouldSkipByCooldown = (signature, cooldownMs) => {
  if (cooldownMs <= 0) return false;
  const now = Date.now();
  const last = recentAlerts.get(signature) || 0;
  if (now - last < cooldownMs) return true;

  recentAlerts.set(signature, now);

  if (recentAlerts.size > 400) {
    const minAllowed = now - cooldownMs;
    for (const [key, value] of recentAlerts.entries()) {
      if (value < minAllowed) recentAlerts.delete(key);
    }
  }

  return false;
};

const buildSignature = (logPayload = {}) =>
  [
    toText(logPayload.level, ""),
    toText(logPayload.module, ""),
    toText(logPayload.event_type, ""),
    toText(logPayload.message, ""),
    toText(logPayload.endpoint, ""),
    toText(logPayload.status_code, ""),
  ]
    .join("|")
    .slice(0, 900);

const buildMessage = (logPayload = {}) => {
  const rows = [
    ["Level", toText(logPayload.level, "-")],
    ["Module", toText(logPayload.module, "-")],
    ["Event", toText(logPayload.event_type, "-")],
    ["Message", toText(logPayload.message, "-")],
    ["Source", toText(logPayload.source, "-")],
    ["Endpoint", toText(logPayload.endpoint, "-")],
    ["Method", toText(logPayload.http_method, "-")],
    ["Status", toText(logPayload.status_code, "-")],
    ["Tracking", toText(logPayload.tracking_number, "-")],
    ["Application ID", toText(logPayload.application_id, "-")],
    ["Staff ID", toText(logPayload.staff_id, "-")],
    ["IP", toText(logPayload.ip_address, "-")],
    ["Time", toText(logPayload.created_at, new Date().toISOString())],
    ["Log ID", toText(logPayload.id, "-")],
  ];

  const contextJson = prettyJson(redactSensitive(logPayload.context));
  const causesJson = prettyJson(redactSensitive(logPayload.causes));
  const errorJson = prettyJson(redactSensitive(logPayload.error_details));

  const textLines = [
    "SYSTEM CRITICAL ALERT",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Context: ${contextJson || "-"}`,
    `Causes: ${causesJson || "-"}`,
    `Error Details: ${errorJson || "-"}`,
  ];

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 8px;border:1px solid #ddd;"><b>${escapeHtml(label)}</b></td><td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;">
      <h3 style="margin:0 0 12px 0;color:#b42318;">System Critical Alert</h3>
      <table style="border-collapse:collapse;width:100%;max-width:900px;margin-bottom:10px;">${htmlRows}</table>
      <p style="margin:10px 0 4px 0;"><b>Context</b></p>
      <pre style="background:#f8f9fb;padding:10px;border:1px solid #e4e7ec;white-space:pre-wrap;">${escapeHtml(
        contextJson || "-"
      )}</pre>
      <p style="margin:10px 0 4px 0;"><b>Causes</b></p>
      <pre style="background:#f8f9fb;padding:10px;border:1px solid #e4e7ec;white-space:pre-wrap;">${escapeHtml(
        causesJson || "-"
      )}</pre>
      <p style="margin:10px 0 4px 0;"><b>Error Details</b></p>
      <pre style="background:#f8f9fb;padding:10px;border:1px solid #e4e7ec;white-space:pre-wrap;">${escapeHtml(
        errorJson || "-"
      )}</pre>
    </div>
  `;

  return {
    text: textLines.join("\n"),
    html,
  };
};

const notifyLogByEmail = async (logPayload = {}) => {
  const config = buildAlertConfig();
  if (!config.enabled) return;

  const level = toText(logPayload.level, "").toLowerCase();
  if (!config.levels.includes(level)) return;

  if (!config.to.length) {
    console.warn("[SYSTEM_LOG][ALERT][SKIPPED_NO_RECIPIENT]", {
      reason: "SYSTEM_LOG_ALERT_TO or ADMIN_EMAIL is empty",
      level,
    });
    return;
  }

  if (!config.host || !config.user || !config.pass) {
    console.warn("[SYSTEM_LOG][ALERT][SKIPPED_MAIL_CONFIG]", {
      reason: "MAIL_HOST/MAIL_USER/MAIL_PASS missing",
      level,
    });
    return;
  }

  const signature = buildSignature(logPayload);
  if (shouldSkipByCooldown(signature, config.cooldownMs)) return;

  const message = buildMessage(logPayload);
  const moduleName = toText(logPayload.module, "general");
  const eventType = toText(logPayload.event_type, "unknown");
  const subject = `${config.subjectPrefix} ${level.toUpperCase()} ${moduleName} :: ${eventType}`;

  try {
    const tx = buildTransporter(config);
    await tx.sendMail({
      from: config.from,
      to: config.to.join(", "),
      cc: config.cc.length ? config.cc.join(", ") : undefined,
      bcc: config.bcc.length ? config.bcc.join(", ") : undefined,
      subject,
      text: message.text,
      html: message.html,
    });
  } catch (error) {
    console.error("[SYSTEM_LOG][ALERT][SEND_FAILED]", {
      message: error?.message || "Unknown email alert error",
      module: moduleName,
      event_type: eventType,
      level,
    });
  }
};

module.exports = {
  notifyLogByEmail,
};
