require("dotenv").config();
const express = require("express");
const applicationCategoryRouter = express.Router();
const { isAuth, sentenceCase } = require("../utils.js");
const applicationCategoryModel = require("../models/applicationCategoryModel.js");

const toBool = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (value === 0 || value === "0" || value === "false") return false;
  if (value === 1 || value === "1" || value === "true") return true;
  return fallback;
};

const normalizePayload = (body = {}) => {
  const appNameInput =
    body.applicationCategoryName || body.applicationCategory_name || body.app_name || body.name || "";
  const applicationCodeInput = body.applicationCode || body.application_code || "";

  return {
    app_name: sentenceCase(String(appNameInput || "").trim()),
    application_code: String(applicationCodeInput || "").trim() || null,
  };
};

// List of Application Categories
applicationCategoryRouter.get("/all-application-categories", isAuth, (req, res, next) => {
  const per_page = Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const offset = (page - 1) * per_page;
  const is_paginated = toBool(
    typeof req.query.is_paginated !== "undefined" ? req.query.is_paginated : req.body?.is_paginated,
    true
  );

  applicationCategoryModel.getAllApplicationCategories(
    offset,
    per_page,
    is_paginated,
    (error, categories, numRows) => {
      return res.send({
        error: !!error,
        statusCode: error ? 306 : 300,
        data: error ? [] : categories,
        numRows: Number(numRows || 0),
        message: error ? "Kuna tatizo, tafadhali jaribu tena." : "List of Application Types.",
      });
    }
  );
});
// Edit Application Category
applicationCategoryRouter.get("/edit-application-category/:id", isAuth, (req, res, next) => {
  const id = Number(req.params.id || 0);
  applicationCategoryModel.findApplicationCategory(id, (error, success, applicationCategory) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? applicationCategory : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

// Store Application Category
applicationCategoryRouter.post("/add-application-category", isAuth, (req, res, next) => {
  const payload = normalizePayload(req.body);
  if (!payload.app_name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Aina ya Ombi ni lazima.",
    });
  }

  applicationCategoryModel.storeApplicationCategory(payload, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili Aina ya Ombi."
        : exists
          ? "Aina hii ya Ombi tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Update Application Category
applicationCategoryRouter.put("/update-application-category/:id", isAuth, (req, res, next) => {
  const id = Number(req.params.id || 0);
  const payload = normalizePayload(req.body);

  if (!payload.app_name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Aina ya Ombi ni lazima.",
    });
  }

  applicationCategoryModel.updateApplicationCategory(payload, id, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili Aina ya Ombi."
        : exists
          ? "Aina hii ya Ombi tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Delete Application Category
applicationCategoryRouter.delete("/delete-application-category/:id", isAuth, (req, res, next) => {
  const id = Number(req.params.id || 0);
  applicationCategoryModel.deleteApplicationCategory(id, (error, success, applicationCategory) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? applicationCategory : [],
      message: success ? "Umefanikiwa kufuta Aina ya Ombi." : error,
    });
  });
});

module.exports = applicationCategoryRouter;
