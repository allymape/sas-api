require("dotenv").config();
const express = require("express");
const systemLogRouter = express.Router();
const { isAuth, permission } = require("../utils");
const systemLogModel = require("../models/systemLogModel");
const { writeSystemLog } = require("../src/Utils/systemLogService");

const toSafeText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const toDateToken = (dateValue) => {
  const value = toSafeText(dateValue, "");
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
};

const toDefaultRange = (value = new Date()) => {
  const now = new Date(value);
  const date = Number.isFinite(now.getTime()) ? now : new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addDays = (dateToken, days = 0) => {
  const date = new Date(`${dateToken}T00:00:00`);
  date.setDate(date.getDate() + Number(days || 0));
  return toDefaultRange(date);
};

const extractFilters = (req, useDefaultRange = false) => {
  const source = req.method === "GET" ? req.query : req.body;
  let from = toDateToken(source?.from);
  let to = toDateToken(source?.to);

  if (useDefaultRange && !from && !to) {
    to = toDefaultRange();
    from = addDays(to, -13);
  }

  return {
    page: source?.page || 1,
    per_page: source?.per_page || source?.length || 20,
    is_paginated: source?.is_paginated,
    level: toSafeText(source?.level, ""),
    module: toSafeText(source?.module, ""),
    event_type: toSafeText(source?.event_type, ""),
    search:
      toSafeText(source?.search, "") ||
      toSafeText(source?.search_text, "") ||
      toSafeText(source?.keyword, ""),
    from,
    to,
  };
};

systemLogRouter.get("/system-logs", isAuth, permission("view-audit"), (req, res) => {
  systemLogModel.getLogs(extractFilters(req), (error, logs, numRows) => {
    return res.send({
      error: !!error,
      statusCode: error ? 306 : 300,
      data: error ? [] : logs,
      numRows: Number(numRows || 0),
      message: error ? "Imeshindikana kupata logs." : "List of system logs.",
    });
  });
});

systemLogRouter.get("/system-logs-summary", isAuth, permission("view-audit"), (req, res) => {
  systemLogModel.getSummary(extractFilters(req, true), (error, summary) => {
    return res.send({
      error: !!error,
      statusCode: error ? 306 : 300,
      data: error
        ? {
            level_totals: {
              total: 0,
              critical: 0,
              error: 0,
              warning: 0,
              info: 0,
              debug: 0,
            },
            by_level: [],
            trend: [],
            top_modules: [],
            top_event_types: [],
          }
        : summary,
      message: error ? "Imeshindikana kupata summary ya logs." : "System logs summary.",
    });
  });
});

systemLogRouter.get("/system-logs/:id", isAuth, permission("view-audit"), (req, res) => {
  systemLogModel.getLogById(req.params.id, (error, log) => {
    return res.send({
      error: !!error,
      statusCode: !error && log ? 300 : 306,
      data: !error && log ? log : null,
      message: !error && log ? "Success" : error?.message || "Log haijapatikana.",
    });
  });
});

systemLogRouter.post("/system-logs", isAuth, (req, res) => {
  const payload = {
    ...req.body,
    req,
    staff_id: req?.user?.id || req?.user?.user_id || req?.user?.userId || null,
  };

  writeSystemLog(payload, (error, result) => {
    return res.send({
      error: !!error,
      statusCode: error ? 306 : 300,
      data: error ? null : { id: result?.insertId || null },
      message: error ? "Imeshindikana kusajili log." : "Log imesajiliwa.",
    });
  });
});

module.exports = systemLogRouter;
