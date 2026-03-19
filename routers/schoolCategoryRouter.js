require("dotenv").config();
const express = require("express");
const schoolCategoryRouter = express.Router();
const { isAuth, sentenceCase } = require("../utils.js");
const schoolCategoryModel = require("../models/schoolCategoryModel.js");

const normalizePayload = (body = {}) => {
  const inputName = body.schoolCategoryName || body.category || body.name || "";
  const inputCode = body.schoolCategoryCode || body.code || "";
  const inputTrackingNumberPrefix = body.schoolCategoryTrackingNumberPrefix || body.tracking_number_prefix || "";

  return {
    name: sentenceCase(String(inputName || "").trim()),
    code: String(inputCode || "").trim() || null,
    tracking_number_prefix: String(inputTrackingNumberPrefix || "").trim() || null,
  };
};

// List of school categories
schoolCategoryRouter.get("/all-school-categories", isAuth, (req, res) => {
  const per_page = Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const offset = (page - 1) * per_page;
  let is_paginated = false;
  if (typeof req.query.is_paginated !== "undefined") {
    is_paginated = !(req.query.is_paginated === "false" || req.query.is_paginated === "0");
  } else if (typeof req.body?.is_paginated !== "undefined") {
    is_paginated = !(req.body.is_paginated === "false" || req.body.is_paginated === false || req.body.is_paginated === 0 || req.body.is_paginated === "0");
  }

  schoolCategoryModel.getAllCategories(offset, per_page, is_paginated, (error, categories, numRows) => {
    console.log(categories)
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : categories,
      numRows: numRows,
      message: error ? "Something went wrong." : "List of School Categories.",
    });
  });
});

// Edit school category
schoolCategoryRouter.get("/edit-school-category/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolCategoryModel.findCategory(id, (error, success, category) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? category : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

// Add school category
schoolCategoryRouter.post("/add-school-category", isAuth, (req, res) => {
  const payload = normalizePayload(req.body);
  if (!payload.name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Aina ya Shule ni lazima.",
    });
  }

  schoolCategoryModel.storeCategory(payload, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili Aina ya Shule."
        : exists
          ? "Aina hii ya Shule tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Update school category
schoolCategoryRouter.put("/update-school-category/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  const payload = normalizePayload(req.body);
  if (!payload.name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Aina ya Shule ni lazima.",
    });
  }

  schoolCategoryModel.updateCategory(payload, id, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili Aina ya Shule."
        : exists
          ? "Aina hii ya Shule tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Delete school category
schoolCategoryRouter.delete("/delete-school-category/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolCategoryModel.deleteCategory(id, (error, success, result) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success ? "Umefanikiwa kufuta Aina ya Shule." : error,
    });
  });
});

module.exports = schoolCategoryRouter;
