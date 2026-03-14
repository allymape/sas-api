require("dotenv").config();
const express = require("express");
const schoolSubCategoryRouter = express.Router();
const { isAuth, sentenceCase } = require("../utils.js");
const schoolSubCategoryModel = require("../models/schoolSubCategoryModel.js");

const normalizePayload = (body = {}) => {
  const inputName = body.schoolSubCategoryName || body.subcategory || body.name || "";
  const inputCode = body.schoolSubCategoryCode || body.code || "";
  return {
    name: sentenceCase(String(inputName || "").trim()),
    code: String(inputCode || "").trim() || null,
  };
};

// List of school sub categories (Aina ya Malazi)
schoolSubCategoryRouter.get("/all-school-sub-categories", isAuth, (req, res) => {
  const per_page = Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const offset = (page - 1) * per_page;

  let is_paginated = false;
  if (typeof req.query.is_paginated !== "undefined") {
    is_paginated = !(req.query.is_paginated === "false" || req.query.is_paginated === "0");
  } else if (typeof req.body?.is_paginated !== "undefined") {
    is_paginated = !(req.body.is_paginated === "false" || req.body.is_paginated === false || req.body.is_paginated === 0 || req.body.is_paginated === "0");
  }

  schoolSubCategoryModel.getAllSubCategories(offset, per_page, is_paginated, (error, subCategories, numRows) => {
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : subCategories,
      numRows: numRows,
      message: error ? "Something went wrong." : "List of School Sub Categories.",
    });
  });
});

// Edit school sub category
schoolSubCategoryRouter.get("/edit-school-sub-category/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolSubCategoryModel.findSubCategory(id, (error, success, subCategory) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? subCategory : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

// Add school sub category
schoolSubCategoryRouter.post("/add-school-sub-category", isAuth, (req, res) => {
  const payload = normalizePayload(req.body);
  if (!payload.name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Aina ya Malazi ni lazima.",
    });
  }

  schoolSubCategoryModel.storeSubCategory(payload, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili Aina ya Malazi."
        : exists
          ? "Aina hii ya Malazi tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Update school sub category
schoolSubCategoryRouter.put("/update-school-sub-category/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  const payload = normalizePayload(req.body);
  if (!payload.name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Aina ya Malazi ni lazima.",
    });
  }

  schoolSubCategoryModel.updateSubCategory(payload, id, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili Aina ya Malazi."
        : exists
          ? "Aina hii ya Malazi tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Delete school sub category
schoolSubCategoryRouter.delete("/delete-school-sub-category/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolSubCategoryModel.deleteSubCategory(id, (error, success, result) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success ? "Umefanikiwa kufuta Aina ya Malazi." : error,
    });
  });
});

module.exports = schoolSubCategoryRouter;
