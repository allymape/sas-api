require("dotenv").config();
const express = require("express");
const schoolTypeStandardRouter = express.Router();
const { isAuth } = require("../utils.js");
const schoolTypeStandardModel = require("../models/schoolTypeStandardModel.js");

const toBool = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (value === 0 || value === "0" || value === "false") return false;
  if (value === 1 || value === "1" || value === "true") return true;
  return fallback;
};

// Lookup lists for form dropdowns
schoolTypeStandardRouter.get("/school-type-standard-lookups", isAuth, (req, res) => {
  schoolTypeStandardModel.getLookups((error, data) => {
    return res.send({
      error: !!error,
      statusCode: error ? 306 : 300,
      data: error ? {} : data,
      message: error ? "Kuna tatizo, tafadhali jaribu tena." : "Lookup data.",
    });
  });
});

// List
schoolTypeStandardRouter.get("/all-school-type-standards", isAuth, (req, res) => {
  const per_page = Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const offset = (page - 1) * per_page;
  const is_paginated = toBool(
    typeof req.query.is_paginated !== "undefined" ? req.query.is_paginated : req.body?.is_paginated,
    true
  );

  schoolTypeStandardModel.getAllSchoolTypeStandards(
    offset,
    per_page,
    is_paginated,
    (error, standards, numRows) => {
      return res.send({
        error: !!error,
        statusCode: error ? 306 : 300,
        data: error ? [] : standards,
        numRows: Number(numRows || 0),
        message: error ? "Kuna tatizo, tafadhali jaribu tena." : "List of School Type Standards.",
      });
    }
  );
});

// Single row
schoolTypeStandardRouter.get("/edit-school-type-standard/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolTypeStandardModel.findSchoolTypeStandard(id, (error, success, schoolTypeStandard) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? schoolTypeStandard : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

// Create
schoolTypeStandardRouter.post("/add-school-type-standard", isAuth, (req, res) => {
  schoolTypeStandardModel.storeSchoolTypeStandard(req.body, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili kiwango cha aina ya shule."
        : exists
          ? "Kiwango hiki tayari kipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Update
schoolTypeStandardRouter.put("/update-school-type-standard/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolTypeStandardModel.updateSchoolTypeStandard(req.body, id, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili kiwango cha aina ya shule."
        : exists
          ? "Kiwango hiki tayari kipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Delete
schoolTypeStandardRouter.delete("/delete-school-type-standard/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolTypeStandardModel.deleteSchoolTypeStandard(id, (error, success, result) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success ? "Umefanikiwa kufuta kiwango cha aina ya shule." : error,
    });
  });
});

module.exports = schoolTypeStandardRouter;
