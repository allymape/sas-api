require("dotenv").config();
const express = require("express");
const languageRouter = express.Router();
const { isAuth, sentenceCase } = require("../utils.js");
const languageModel = require("../models/languageModel.js");

const normalizePayload = (body = {}) => {
  const input = body.languageName || body.language || body.name || "";
  return {
    language: sentenceCase(String(input || "").trim()),
  };
};

// List of languages
languageRouter.get("/all-languages", isAuth, (req, res) => {
  const per_page = Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const offset = (page - 1) * per_page;

  let is_paginated = false;
  if (typeof req.query.is_paginated !== "undefined") {
    is_paginated = !(req.query.is_paginated === "false" || req.query.is_paginated === "0");
  } else if (typeof req.body?.is_paginated !== "undefined") {
    is_paginated = !(req.body.is_paginated === "false" || req.body.is_paginated === false || req.body.is_paginated === 0 || req.body.is_paginated === "0");
  }

  languageModel.getAllLanguages(offset, per_page, is_paginated, (error, languages, numRows) => {
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : languages,
      numRows: numRows,
      message: error ? "Something went wrong." : "List of Languages.",
    });
  });
});

// Edit language
languageRouter.get("/edit-language/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  languageModel.findLanguage(id, (error, success, language) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? language : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

// Add language
languageRouter.post("/add-language", isAuth, (req, res) => {
  const payload = normalizePayload(req.body);
  if (!payload.language) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Lugha ni lazima.",
    });
  }

  languageModel.storeLanguage(payload, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili Lugha."
        : exists
          ? "Lugha hii tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Update language
languageRouter.put("/update-language/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  const payload = normalizePayload(req.body);
  if (!payload.language) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Lugha ni lazima.",
    });
  }

  languageModel.updateLanguage(payload, id, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili Lugha."
        : exists
          ? "Lugha hii tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

// Delete language
languageRouter.delete("/delete-language/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  languageModel.deleteLanguage(id, (error, success, result) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success ? "Umefanikiwa kufuta Lugha." : error,
    });
  });
});

module.exports = languageRouter;
