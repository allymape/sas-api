require("dotenv").config();
const express = require("express");
const workflowRouter = express.Router();
const { isAuth , formatDate , permit, permission } = require("../utils.js");
const sharedModel = require("../models/sharedModel.js");
const workflowModel = require("../models/workflowModel.js");
const roleModel = require("../models/roleModel.js");
//Workflow lookup data
workflowRouter.get('/workflow-lookup' , (req , res) => {
    sharedModel.getApplicationCategories((categories) => {
       sharedModel.getHierarchies((hierarchies) => {
         roleModel.lookupRoles(req.user, (error, roles) => {
           res.send({
             categories,
             hierarchies,
             roles: error ? [] : roles,
           });
         });
       });
    })
})
// List of workflow
workflowRouter.get("/all-workflows", isAuth, permission('view-workflow'), (req, res, next) => {
  var per_page = parseInt(req.query.per_page || 10);
  var page = parseInt(req.query.page || 1);
  var offset = (page - 1) * per_page;
  var is_paginated = true;
  var application_category_id = req.query.application_category_id;
  var deleted_scope = String(req.query.deleted_scope || "active").toLowerCase();
  if (!["active", "deleted", "all"].includes(deleted_scope)) {
    deleted_scope = "active";
  }
  if (typeof req.query.is_paginated !== "undefined") {
      is_paginated =
        req.query.is_paginated == "false" || !req.query.is_paginated
          ? false
          : true;
  }
  
  workflowModel.getAllWorkflows(offset, per_page, is_paginated , application_category_id, deleted_scope, (error, workflow, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? error : workflow,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of workflow.",
            });
  });
});
// Edit workflow
workflowRouter.get(
  "/editworkflow/:id",
  isAuth,
  permission("update-workflow"),
  (req, res) => {
    var id = req.params.id;
    workflowModel.findWorkflow(id, (error, success, workflow) => {
      return res.send({
        success: success ? true : false,
        statusCode: success ? 300 : 306,
        data: success ? workflow : error,
        message: success ? "Success" : "Not found",
      });
    });
  }
);

// Store workflow
workflowRouter.post(
  "/createworkflow",
  isAuth,
  permission("create-workflow"),
  (req, res, next) => {
    workflowModel.insertOrUpdateWorkflow(req, req.body, (success, message) => {
      return res.send({
        success: success,
        statusCode: success ? 300 : 306,
        message: message,
      });
    });
  }
);

// Store workflow
workflowRouter.put(
  "/updateworkflow/:id",
  isAuth,
  permission("update-workflow"),
  (req, res) => {
    const id = req.params.id;
    workflowModel.updateWorkflow(req, id, req.body, (success, message) => {
      return res.send({
        success: success,
        statusCode: success ? 300 : 306,
        message: message,
      });
    });
  }
);

// Store workflow
workflowRouter.delete(
  "/deleteworkflow/:id",
  isAuth,
  permission("delete-workflow"),
  (req, res) => {
    var id = Number(req.params.id);
    workflowModel.deleteWorkflow(req, id, (success) => {
      return res.send({
        success: success ? true : false,
        statusCode: success ? 300 : 306,
        message: `${
          success ? "Umefanikiwa" : "Haujafanikiwa"
        } kufuta mtiririko wa utendaji kazi.`,
      });
    });
  }
);

workflowRouter.put(
  "/restoreworkflow/:id",
  isAuth,
  permission("delete-workflow"),
  (req, res) => {
    const id = Number(req.params.id);
    workflowModel.restoreWorkflow(req, id, (success, message) => {
      return res.send({
        success: success ? true : false,
        statusCode: success ? 300 : 306,
        message:
          message ||
          `${
            success ? "Umefanikiwa" : "Haujafanikiwa"
          } kurejesha mtiririko wa utendaji kazi.`,
      });
    });
  }
);

module.exports = workflowRouter;
