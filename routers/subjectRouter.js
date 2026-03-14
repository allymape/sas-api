require("dotenv").config();
const express = require("express");
const subjectRouter = express.Router();
const { isAuth, sentenceCase } = require("../utils.js");
const subjectModel = require("../models/subjectModel.js");

const normalizePayload = (body = {}) => {
  const inputName = body.subjectName || body.subject_name || body.subject || body.name || "";
  return {
    name: sentenceCase(String(inputName || "").trim()),
  };
};

// List of subjects
subjectRouter.get("/all-subjects", isAuth, (req, res) => {
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

  subjectModel.getAllSubjects(offset, per_page, is_paginated, (error, subjects, numRows) => {
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : subjects,
      numRows: numRows,
      message: error ? "Something went wrong." : "List of Subjects.",
    });
  });
});

// Edit subject
subjectRouter.get("/edit-subject/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  subjectModel.findSubject(id, (error, success, subject) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? subject : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

// Add subject
subjectRouter.post("/add-subject", isAuth, (req, res) => {
  const payload = normalizePayload(req.body);
  if (!payload.name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Somo ni lazima.",
    });
  }

  subjectModel.storeSubject(payload, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili Somo."
        : exists
          ? "Somo hili tayari lipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Update subject
subjectRouter.put("/update-subject/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  const payload = normalizePayload(req.body);
  if (!payload.name) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Somo ni lazima.",
    });
  }

  subjectModel.updateSubject(payload, id, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili Somo."
        : exists
          ? "Somo hili tayari lipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Delete subject
subjectRouter.delete("/delete-subject/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  subjectModel.deleteSubject(id, (error, success, result) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success ? "Umefanikiwa kufuta Somo." : error,
    });
  });
});

module.exports = subjectRouter;
