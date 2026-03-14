require("dotenv").config();
const express = require("express");
const curriculumRouter = express.Router();
const { isAuth, sentenceCase } = require("../utils.js");
const curriculumModel = require("../models/curriculumModel.js");

const normalizePayload = (body = {}) => {
  const inputName = body.curriculumName || body.curriculum || body.name || "";
  return {
    name: sentenceCase(String(inputName || "").trim()),
  };
};

// List of curricula
curriculumRouter.get("/all-curricula", isAuth, (req, res) => {
  const per_page = Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const offset = (page - 1) * per_page;

  let is_paginated = false;
  if (typeof req.query.is_paginated !== "undefined") {
    is_paginated = !(req.query.is_paginated === "false" || req.query.is_paginated === "0");
  } else if (typeof req.body?.is_paginated !== "undefined") {
    is_paginated = !(
      req.body.is_paginated === "false" ||
      req.body.is_paginated === false ||
      req.body.is_paginated === 0 ||
      req.body.is_paginated === "0"
    );
  }

  curriculumModel.getAllCurricula(offset, per_page, is_paginated, (error, curricula, numRows) => {
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : curricula,
      numRows: numRows,
      message: error ? "Something went wrong." : "List of Curricula.",
    });
  });
});

// Edit curriculum
curriculumRouter.get("/edit-curriculum/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  curriculumModel.findCurriculum(id, (error, success, curriculum) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? curriculum : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

// Add curriculum
curriculumRouter.post("/add-curriculum", isAuth, (req, res) => {
  const payload = normalizePayload(req.body);
  if (!payload.name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Mtaala ni lazima.",
    });
  }

  curriculumModel.storeCurriculum(payload, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili Mtaala."
        : exists
          ? "Mtaala huu tayari upo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Update curriculum
curriculumRouter.put("/update-curriculum/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  const payload = normalizePayload(req.body);
  if (!payload.name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Mtaala ni lazima.",
    });
  }

  curriculumModel.updateCurriculum(payload, id, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili Mtaala."
        : exists
          ? "Mtaala huu tayari upo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Delete curriculum
curriculumRouter.delete("/delete-curriculum/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  curriculumModel.deleteCurriculum(id, (error, success, result) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success ? "Umefanikiwa kufuta Mtaala." : error,
    });
  });
});

module.exports = curriculumRouter;
