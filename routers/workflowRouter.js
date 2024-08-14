require("dotenv").config();
const express = require("express");
const workflowRouter = express.Router();
const { isAuth , formatDate , permit, permission } = require("../utils.js");
const sharedModel = require("../models/sharedModel.js");
const workflowModel = require("../models/workflowModel.js");
//Workflow lookup data
workflowRouter.get('/workflow-lookup' , (req , res) => {
    sharedModel.getApplicationCategories((categories) => {
       sharedModel.getHierarchies((hierarchies) => {
         res.send({
           categories,
           hierarchies,
         });
       });
    })
})
// List of workflow
workflowRouter.get("/all-workflows", isAuth, permission('view-workflow'), (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var is_paginated = true;
  var application_category_id = req.body.application_category_id;
  if (typeof req.body.is_paginated !== "undefined") {
      is_paginated =
        req.body.is_paginated == "false" || !req.body.is_paginated
          ? false
          : true;
  }
  
  workflowModel.getAllWorkflows(offset, per_page, is_paginated , application_category_id, (error, workflow, numRows) => {
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
    const formData = [];
    const { application_categories, from, to, order } = req.body;
    const applicationCategories =
      typeof application_categories === "object"
        ? application_categories
        : [application_categories];
    const _from = typeof from === "object" ? from : [from];
    const _to = typeof to === "object" ? to : [to];
    const _order = typeof order === "object" ? order : [order];
    applicationCategories.forEach((app_id) => {
      _from.forEach((value, index) => {
        formData.push([
          Number(app_id),
          Number(value),
          Number(_to[index]),
          Number(_order[index]),
          formatDate(new Date()),
        ]);
      });
    });
    console.log(formData);
    // return;
    workflowModel.insertOrUpdateWorkflow(req, formData, (success, message) => {
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
    const formData = req.body;
    const id = req.params.id;
    console.log(formData);
    workflowModel.insertOrUpdateWorkflow(id, formData, (success, message) => {
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
    workflowModel.deleteWorkflow(id, (success) => {
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

module.exports = workflowRouter;
