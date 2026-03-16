require("dotenv").config();
const express = require("express");
const moduleRouter = express.Router();
const { isAuth, paramCase, sentenceCase } = require("../utils.js");
const moduleModel = require("../models/moduleModel.js");

const toBooleanStatus = (value, fallback = 1) => {
  if (typeof value === "undefined" || value === null || value === "") {
    return fallback;
  }
  if (value === true || value === "on" || value === 1 || value === "1") {
    return 1;
  }
  return 0;
};

const normalizePayload = (body = {}) => {
  const rawName = body.moduleName || body.module_name || body.name || "";
  const rawDisplay = body.displayName || body.display_name || "";
  return {
    module_name: paramCase(String(rawName || "").trim()),
    display_name: sentenceCase(String(rawDisplay || "").trim()) || null,
  };
};

// List of modules
moduleRouter.get("/allModules", isAuth, (req, res) => {
  const per_page = Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const offset = (page - 1) * per_page;
  const search = req.body?.tafuta || req.query?.tafuta || null;
  let is_paginated = true;
  let status = false;

  if (typeof req.query.is_paginated !== "undefined") {
    is_paginated = !(req.query.is_paginated === "false" || req.query.is_paginated === "0");
  } else if (typeof req.body?.is_paginated !== "undefined") {
    is_paginated = !(req.body.is_paginated === "false" || req.body.is_paginated === false || req.body.is_paginated === 0 || req.body.is_paginated === "0");
  }

  if (typeof req.query.status !== "undefined") {
    status = toBooleanStatus(req.query.status, 1);
  } else if (typeof req.query.is_active !== "undefined") {
    status = toBooleanStatus(req.query.is_active, 1);
  } else if (typeof req.body?.status !== "undefined") {
    status = toBooleanStatus(req.body.status, 1);
  } else if (typeof req.body?.is_active !== "undefined") {
    status = toBooleanStatus(req.body.is_active, 1);
  }

  moduleModel.getAllModules(offset, per_page, is_paginated, search, (error, modules, numRows) => {
    return res.send({
      error: !!error,
      statusCode: error ? 306 : 300,
      data: error ? [] : modules,
      numRows: numRows,
      message: error ? "Something went wrong." : "List of Modules.",
    });
  }, status);
});

// Edit module
moduleRouter.get("/editModule/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  moduleModel.findModule(id, (error, success, moduleData) => {
    return res.send({
      success: !!success,
      statusCode: success ? 300 : 306,
      data: success ? moduleData : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

// Store module
moduleRouter.post("/addModule", isAuth, (req, res) => {
  const payload = normalizePayload(req.body);
  payload.created_by = Number(req.user?.id || 0) || null;
  payload.updated_by = payload.created_by;
  payload.is_active = 1;

  if (!payload.module_name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Jina la moduli ni lazima.",
    });
  }

  moduleModel.storeModule(payload, (error, success, result, exists) => {
    return res.send({
      success: !!success,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili moduli."
        : exists
          ? "Moduli hii tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Update module
moduleRouter.put("/updateModule/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  const payload = normalizePayload(req.body);
  payload.updated_by = Number(req.user?.id || 0) || null;
  payload.is_active = toBooleanStatus(
    typeof req.body.is_active !== "undefined" ? req.body.is_active : req.body.status,
    0
  );

  if (!payload.module_name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Jina la moduli ni lazima.",
    });
  }

  moduleModel.updateModule(payload, id, (error, success, result, exists) => {
    return res.send({
      success: !!success,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili moduli."
        : exists
          ? "Moduli hii tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Delete module
moduleRouter.delete("/deleteModule/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  moduleModel.deleteModule(id, (error, success, result) => {
    return res.send({
      success: !!success,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success ? "Umefanikiwa kufuta moduli." : error,
    });
  });
});

module.exports = moduleRouter;
