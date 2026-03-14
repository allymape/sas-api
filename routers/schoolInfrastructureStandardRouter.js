require("dotenv").config();
const express = require("express");
const schoolInfrastructureStandardRouter = express.Router();
const { isAuth } = require("../utils.js");
const schoolInfrastructureStandardModel = require("../models/schoolInfrastructureStandardModel.js");

const toBool = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (value === 0 || value === "0" || value === "false") return false;
  if (value === 1 || value === "1" || value === "true") return true;
  return fallback;
};

// Lookup lists for form dropdowns
schoolInfrastructureStandardRouter.get("/school-infrastructure-standard-lookups", isAuth, (req, res) => {
  schoolInfrastructureStandardModel.getLookups((error, data) => {
    return res.send({
      error: !!error,
      statusCode: error ? 306 : 300,
      data: error ? {} : data,
      message: error ? "Kuna tatizo, tafadhali jaribu tena." : "Lookup data.",
    });
  });
});

// ---------- Infrastructure items CRUD ----------

schoolInfrastructureStandardRouter.get("/all-infrastructure-items", isAuth, (req, res) => {
  const per_page = Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const offset = (page - 1) * per_page;
  const is_paginated = toBool(
    typeof req.query.is_paginated !== "undefined" ? req.query.is_paginated : req.body?.is_paginated,
    true
  );

  schoolInfrastructureStandardModel.getAllInfrastructureItems(
    offset,
    per_page,
    is_paginated,
    (error, items, numRows) => {
      return res.send({
        error: !!error,
        statusCode: error ? 306 : 300,
        data: error ? [] : items,
        numRows: Number(numRows || 0),
        message: error ? "Kuna tatizo, tafadhali jaribu tena." : "List of infrastructure items.",
      });
    }
  );
});

schoolInfrastructureStandardRouter.get("/edit-infrastructure-item/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolInfrastructureStandardModel.findInfrastructureItem(id, (error, success, item) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? item : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

schoolInfrastructureStandardRouter.post("/add-infrastructure-item", isAuth, (req, res) => {
  schoolInfrastructureStandardModel.storeInfrastructureItem(req.body, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili kipengele cha miundombinu."
        : exists
          ? "Kipengele hiki tayari kipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

schoolInfrastructureStandardRouter.put("/update-infrastructure-item/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolInfrastructureStandardModel.updateInfrastructureItem(req.body, id, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili kipengele cha miundombinu."
        : exists
          ? "Kipengele hiki tayari kipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

schoolInfrastructureStandardRouter.delete("/delete-infrastructure-item/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolInfrastructureStandardModel.deleteInfrastructureItem(id, (error, success, result) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success ? "Umefanikiwa kufuta kipengele cha miundombinu." : error,
    });
  });
});

// ---------- School infrastructure standards CRUD ----------

schoolInfrastructureStandardRouter.get("/all-school-infrastructure-standards", isAuth, (req, res) => {
  const per_page = Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const offset = (page - 1) * per_page;
  const is_paginated = toBool(
    typeof req.query.is_paginated !== "undefined" ? req.query.is_paginated : req.body?.is_paginated,
    true
  );

  schoolInfrastructureStandardModel.getAllStandards(offset, per_page, is_paginated, (error, rows, numRows) => {
    return res.send({
      error: !!error,
      statusCode: error ? 306 : 300,
      data: error ? [] : rows,
      numRows: Number(numRows || 0),
      message: error ? "Kuna tatizo, tafadhali jaribu tena." : "List of School Infrastructure Standards.",
    });
  });
});

schoolInfrastructureStandardRouter.get("/edit-school-infrastructure-standard/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolInfrastructureStandardModel.findStandard(id, (error, success, standard) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? standard : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

schoolInfrastructureStandardRouter.post("/add-school-infrastructure-standard", isAuth, (req, res) => {
  schoolInfrastructureStandardModel.storeStandard(req.body, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili kiwango cha miundombinu."
        : exists
          ? "Kiwango hiki tayari kipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

schoolInfrastructureStandardRouter.put("/update-school-infrastructure-standard/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolInfrastructureStandardModel.updateStandard(req.body, id, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili kiwango cha miundombinu."
        : exists
          ? "Kiwango hiki tayari kipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

schoolInfrastructureStandardRouter.delete("/delete-school-infrastructure-standard/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolInfrastructureStandardModel.deleteStandard(id, (error, success, result) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success ? "Umefanikiwa kufuta kiwango cha miundombinu." : error,
    });
  });
});

module.exports = schoolInfrastructureStandardRouter;
