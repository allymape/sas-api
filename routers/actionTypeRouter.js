require("dotenv").config();
const express = require("express");
const actionTypeRouter = express.Router();
const { isAuth, permission } = require("../utils.js");
const actionTypeModel = require("../models/actionTypeModel.js");

const normalizeCode = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const normalizePayload = (body = {}) => {
  const inputName = body.actionTypeName || body.name || "";
  const inputCode = body.actionTypeCode || body.code || "";
  const inputDescription = body.actionTypeDescription || body.description || "";

  return {
    name: String(inputName || "").trim(),
    code: normalizeCode(inputCode),
    description: String(inputDescription || "").trim() || null,
  };
};

const getActorId = (req = {}) => {
  const idValue = req?.user?.id || req?.user?.user_id || req?.user?.userId || null;
  const parsed = Number(idValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

actionTypeRouter.get("/all-action-types", isAuth, permission("view-workflow"), (req, res) => {
  const per_page = Math.max(1, Number.parseInt(req.query.per_page || "10", 10) || 10);
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const offset = (page - 1) * per_page;

  let is_paginated = true;
  if (typeof req.query.is_paginated !== "undefined") {
    is_paginated = !(req.query.is_paginated === "false" || req.query.is_paginated === "0");
  } else if (typeof req.body?.is_paginated !== "undefined") {
    is_paginated = !(req.body.is_paginated === "false" || req.body.is_paginated === false || req.body.is_paginated === 0 || req.body.is_paginated === "0");
  }

  actionTypeModel.getAllActionTypes(offset, per_page, is_paginated, (error, actionTypes, numRows) => {
    return res.send({
      error: !!error,
      statusCode: error ? 306 : 300,
      data: error ? [] : actionTypes,
      numRows,
      message: error ? "Something went wrong." : "List of Action Types.",
    });
  });
});

actionTypeRouter.get("/action-types", isAuth, permission("view-workflow"), (req, res) => {
  actionTypeModel.lookupActionTypes((error, actionTypes) => {
    return res.send({
      error: !!error,
      statusCode: error ? 306 : 300,
      data: error ? [] : actionTypes,
      message: error ? "Something went wrong." : "List of Action Types.",
    });
  });
});

actionTypeRouter.get("/edit-action-type/:id", isAuth, permission("update-workflow"), (req, res) => {
  const id = Number(req.params.id || 0);
  actionTypeModel.findActionType(id, (error, success, actionType) => {
    return res.send({
      success: !!success,
      statusCode: success ? 300 : 306,
      data: success ? actionType : [],
      message: success ? "Success" : error?.message || "Not found",
    });
  });
});

actionTypeRouter.post("/add-action-type", isAuth, permission("create-workflow"), (req, res) => {
  const payload = normalizePayload(req.body);
  if (!payload.name || !payload.code) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Jina na code ni lazima.",
    });
  }

  actionTypeModel.storeActionType(payload, getActorId(req), (error, success, result, exists) => {
    return res.send({
      success: !!success,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kusajili aina ya hatua."
        : exists
          ? "Code hii ya hatua tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na wasimamizi wa mfumo.",
    });
  });
});

actionTypeRouter.put("/update-action-type/:id", isAuth, permission("update-workflow"), (req, res) => {
  const id = Number(req.params.id || 0);
  const payload = normalizePayload(req.body);
  if (!payload.name || !payload.code) {
    return res.send({
      success: false,
      statusCode: 306,
      data: [],
      message: "Jina na code ni lazima.",
    });
  }

  actionTypeModel.updateActionType(payload, id, getActorId(req), (error, success, result, exists) => {
    return res.send({
      success: !!success,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success
        ? "Umefanikiwa kubadili aina ya hatua."
        : exists
          ? "Code hii ya hatua tayari ipo."
          : error?.message || "Kuna shida tafadhali wasiliana na wasimamizi wa mfumo.",
    });
  });
});

actionTypeRouter.delete("/delete-action-type/:id", isAuth, permission("delete-workflow"), (req, res) => {
  const id = Number(req.params.id || 0);
  actionTypeModel.deleteActionType(id, getActorId(req), (error, success, result) => {
    return res.send({
      success: !!success,
      statusCode: success ? 300 : 306,
      data: success ? result : [],
      message: success ? "Umefanikiwa kufuta aina ya hatua." : error || "Haujafanikiwa kufuta aina ya hatua.",
    });
  });
});

module.exports = actionTypeRouter;
