require("dotenv").config();
const express = require("express");
const request = require("request");
const applicantRouter = express.Router();
const {
  isAuth,
  isAdmin,
  formatDate,
  permit,
  paramCase,
  sentenceCase,
} = require("../utils.js");
const applicantModel = require("../models/applicantModel.js");

// List of Application Categories
applicantRouter.get("/all-applicants", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var search = req.body.search;
  var is_paginated = true;
  if (typeof req.body.is_paginated !== "undefined") {
    is_paginated =
      req.body.is_paginated == "false" || !req.body.is_paginated ? false : true;
  }
  applicantModel.getAllApplicants(
    offset,
    per_page,
    is_paginated,
    search,
    (error, applicants, numRows) => {
      //  console.log(applicants);
      return res.send({
        error: error ? true : false,
        statusCode: error ? 306 : 300,
        data: error ? [] : applicants,
        numRows: numRows,
        message: error ? "Something went wrong." : "List of Applicants.",
      });
    }
  );
});
// Look for applicant
applicantRouter.get("/look_for_applicants", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var search = req.body.search;
  var exclude = req.body.exclude;
  applicantModel.lookForApplicants(
    offset,
    per_page,
    search,
    exclude,
    (error, applicants) => {
      res.send({
        statusCode: error ? 306 : 300,
        data: error ? [] : applicants,
        message: error ? "Something went wrong" : "List of applicants",
      });
    }
  );
});
// List of Applicant
applicantRouter.get("/find-applicant/:id", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var applicant_id = req.params.id;
  var search = req.body.search;
  applicantModel.findApplicant(
    offset,
    per_page,
    applicant_id,
    search,
    (
      error,
      applicant,
      applications,
      applicationsNumRows,
      schools,
      schoolsNumRows,
      attachments,
      attachmentsNumRows
    ) => {
      return res.send({
        error: error ? true : false,
        statusCode: error ? 306 : 300,
        data: {
          applicant: error ? [] : applicant,
          applications: error ? [] : applications,
          applicationsNumRows: applicationsNumRows,
          schools: error ? [] : schools,
          schoolsNumRows: schoolsNumRows,
          attachments : error ? [] : attachments,
          attachmentsNumRows : attachmentsNumRows
        },
        message: error ? "Something went wrong." : "Applicant",
      });
    }
  );
});
// Edit of Applicant
applicantRouter.get("/edit-applicant/:id/edit", isAuth, (req, res, next) => {
  var applicant_id = req.params.id;
  applicantModel.findOneApplicant(applicant_id, (error, applicant) => {
    return res.send({
          error: error ? true : false,
          statusCode: error ? 306 : 300,
          data: error ? [] : applicant,
          message: error ? "Something went wrong." : "Applicant",
    });
  });
});
// Change applicant of school
applicantRouter.post("/change-school-applicant", isAuth, (req, res, next) => {
  var data = [Number(req.body.user_id), req.body.tracking_number];
  applicantModel.changeApplicant(data, (success) => {
    res.send({
      statusCode: success ? 300 : 306,
      message: success
        ? "Umefanikiwa kubadili Mwombaji wa shule hii"
        : "Haujafaniliwa kuna tatizo.",
    });
  });
});
module.exports = applicantRouter;
