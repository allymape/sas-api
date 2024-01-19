require("dotenv").config();
const express = require("express");
const request = require("request");
const workflowRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");

var session = require("express-session");
const sharedModel = require("../models/sharedModel.js");
const workflowModel = require("../models/workflowModel.js");
workflowRouter.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

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
workflowRouter.get("/editworkflow/:id", isAuth, (req, res) => {
    var id = req.params.id;
  workflowModel.findWorkflow(id, (error , success, workflow) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? workflow : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store workflow
workflowRouter.post("/createworkflow", isAuth, (req, res, next) => {
            const formData = req.body
            workflowModel.storeWorkflow(formData, (success , message) => {
              return res.send({
                success: success,
                statusCode: success ? 300 : 306,
                message: message
              });
            });
});

// Store workflow
workflowRouter.put("/updateworkflow/:id", isAuth, (req, res) => {
            const formData = req.body;
            const id = req.params.id;
            workflowModel.updateWorkflow(id , formData, (success, message) => {
              return res.send({
                success: success,
                statusCode: success ? 300 : 306,
                message: message,
              });
            });
            
});

// Store workflow
workflowRouter.put("/deleteworkflow/:id", isAuth, (req, res) => {
            var id = Number(req.params.id);
            workflowModel.deleteworkflow(id , (error , success , workflow) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? workflow : [],
                        message: success ? "Umefanikiwa kufuta Kanda." : 'Haujafanikiwa kufuta kuna Tatizo, Tafadhali hakiki kama Kanda hii haijatumika kwanza',
                     });
                    
            });
});

module.exports = workflowRouter;
