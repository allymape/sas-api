require("dotenv").config();
const express = require("express");
const schoolFileNumberMappingRouter = express.Router();
const { isAuth } = require("../utils.js");
const schoolFileNumberMappingModel = require("../models/schoolFileNumberMappingModel.js");

const toPayload = (body = {}) => ({
  registry_type_id: Number.parseInt(body.registry_type_id, 10) || 0,
  school_category_id: Number.parseInt(body.school_category_id, 10) || 0,
  file_number: String(body.file_number || "").trim(),
  is_active: Number(body.is_active) === 0 ? 0 : 1,
});

schoolFileNumberMappingRouter.get("/all-school-file-number-mappings", isAuth, (req, res) => {
  const per_page = Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const offset = (page - 1) * per_page;
  let is_paginated = false;

  if (typeof req.query.is_paginated !== "undefined") {
    is_paginated = !(req.query.is_paginated === "false" || req.query.is_paginated === "0");
  } else if (typeof req.body?.is_paginated !== "undefined") {
    is_paginated = !(req.body.is_paginated === "false" || req.body.is_paginated === false || req.body.is_paginated === "0" || req.body.is_paginated === 0);
  }

  schoolFileNumberMappingModel.getAllMappings(offset, per_page, is_paginated, (error, rows, numRows) => {
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? [] : rows,
      numRows,
      message: error ? "Something went wrong." : "List of School File Number Mappings.",
    });
  });
});

schoolFileNumberMappingRouter.get("/school-file-number-mappings-lookup", isAuth, (req, res) => {
  schoolFileNumberMappingModel.getLookups((error, data) => {
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? { registries: [], categories: [] } : data,
      message: error ? "Something went wrong." : "Lookup data.",
    });
  });
});

schoolFileNumberMappingRouter.get("/edit-school-file-number-mapping/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolFileNumberMappingModel.findMapping(id, (error, success, rows) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? rows : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

schoolFileNumberMappingRouter.post("/add-school-file-number-mapping", isAuth, (req, res) => {
  const payload = toPayload(req.body);
  schoolFileNumberMappingModel.storeMapping(payload, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili namba ya jalada."
        : exists
          ? "Mchanganyiko huu wa Registry na Category tayari upo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

schoolFileNumberMappingRouter.put("/update-school-file-number-mapping/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  const payload = toPayload(req.body);
  schoolFileNumberMappingModel.updateMapping(id, payload, (error, success, result, exists) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili namba ya jalada."
        : exists
          ? "Mchanganyiko huu wa Registry na Category tayari upo."
          : error?.message || "Kuna shida tafadhali wasiliana na Wasimamizi wa Mfumo.",
    });
  });
});

schoolFileNumberMappingRouter.delete("/delete-school-file-number-mapping/:id", isAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  schoolFileNumberMappingModel.deleteMapping(id, (error, success, result) => {
    return res.send({
      success: success ? true : false,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kufuta namba ya jalada."
        : error?.message || "Haujafanikiwa kufuta namba ya jalada.",
    });
  });
});

module.exports = schoolFileNumberMappingRouter;

