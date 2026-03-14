require("dotenv").config();
const express = require("express");
const combinationSubjectRouter = express.Router();
const { isAuth } = require("../utils.js");
const combinationSubjectModel = require("../models/combinationSubjectModel.js");

const toId = (value) => Number.parseInt(value || 0, 10) || 0;

const normalizeSubjectIds = (input) => {
  if (Array.isArray(input)) {
    return [...new Set(input.map((value) => toId(value)).filter((id) => id > 0))];
  }

  if (typeof input === "string" && input.includes(",")) {
    return [...new Set(input.split(",").map((value) => toId(value.trim())).filter((id) => id > 0))];
  }

  const one = toId(input);
  return one > 0 ? [one] : [];
};

const normalizeCreatePayload = (body = {}) => {
  const subjectInput = typeof body.subject_ids !== "undefined" ? body.subject_ids : body.subject_id;
  return {
    combination_id: toId(body.combination_id || body.combinationId),
    subject_ids: normalizeSubjectIds(subjectInput),
  };
};

const normalizeUpdatePayload = (body = {}) => {
  return {
    combination_id: toId(body.combination_id || body.combinationId),
    subject_id: toId(body.subject_id || body.subjectId),
  };
};

// List of combination subjects
combinationSubjectRouter.get("/all-combination-subjects", isAuth, (req, res) => {
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

  combinationSubjectModel.getAllCombinationSubjects(
    offset,
    per_page,
    is_paginated,
    (error, combinationSubjects, numRows) => {
      return res.send({
        error: error ? true : false,
        statusCode: error ? 306 : 300,
        data: error ? [] : combinationSubjects,
        numRows: numRows,
        message: error ? "Something went wrong." : "List of Combination Subjects.",
      });
    }
  );
});

// Lookup for form options
combinationSubjectRouter.get("/combination-subjects-lookup", isAuth, (req, res) => {
  combinationSubjectModel.getLookupData((error, lookup) => {
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? { combinations: [], subjects: [] } : lookup,
      message: error ? "Something went wrong." : "Lookup data.",
    });
  });
});

// Edit combination subject
combinationSubjectRouter.get("/edit-combination-subject/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  combinationSubjectModel.findCombinationSubject(id, (error, success, combinationSubject) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? combinationSubject : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

// Add combination subject
combinationSubjectRouter.post("/add-combination-subject", isAuth, (req, res) => {
  const payload = normalizeCreatePayload(req.body);
  if (!payload.combination_id || payload.subject_ids.length === 0) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Tafadhali chagua Tahasusi na Somo angalau moja.",
    });
  }

  combinationSubjectModel.storeCombinationSubjects(payload, (error, success, result, exists) => {
    const insertedCount = Number(result?.inserted_count || 0);
    const skippedCount = Number(result?.skipped_count || 0);

    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? skippedCount > 0
          ? `Umefanikiwa kusajili ${insertedCount} Somo, na ${skippedCount} yalikuwepo tayari.`
          : "Umefanikiwa kusajili Masomo ya Mchepuo."
        : exists
          ? "Masomo uliyochagua yameshasajiliwa tayari kwenye Tahasusi hii."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Update combination subject
combinationSubjectRouter.put("/update-combination-subject/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  const payload = normalizeUpdatePayload(req.body);
  if (!payload.combination_id || !payload.subject_id) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Tafadhali chagua Tahasusi na Somo.",
    });
  }

  combinationSubjectModel.updateCombinationSubject(payload, id, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili Somo la Mchepuo."
        : exists
          ? "Somo hili tayari limeshasajiliwa kwenye Tahasusi hii."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Delete combination subject
combinationSubjectRouter.delete("/delete-combination-subject/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  combinationSubjectModel.deleteCombinationSubject(id, (error, success, result) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success ? "Umefanikiwa kufuta Somo la Mchepuo." : error,
    });
  });
});

module.exports = combinationSubjectRouter;
