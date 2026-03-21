require("dotenv").config();
const express = require("express");
const request = require("request");
const applicantRouter = express.Router();
const {
  isAuth,
  isAdmin,
  formatDate,
  permit,
  permission,
  paramCase,
  sentenceCase,
} = require("../utils.js");
const applicantModel = require("../models/applicantModel.js");

const normalizeSearchValue = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") {
    return String(value.value ?? value.q ?? "").trim();
  }
  return String(value).trim();
};

const extractSearchValue = (req) => {
  // Supports:
  // - DataTables: search[value]=...
  // - Legacy: search_value=...
  // - Custom: q=...
  const querySearch = req.query?.search;
  const querySearchValue = req.query?.search_value;
  const bodySearch = req.body?.search;
  const bodySearchValue = req.body?.search_value;

  return (
    normalizeSearchValue(querySearchValue) ||
    normalizeSearchValue(querySearch) ||
    normalizeSearchValue(bodySearchValue) ||
    normalizeSearchValue(bodySearch?.value) ||
    ""
  );
};

// Enhanced response formatter
const formatApplicantResponse = (applicants, totalRecords, page, perPage) => {
  return {
    data: applicants,
    pagination: {
      total: totalRecords,
      per_page: perPage,
      current_page: page,
      last_page: Math.ceil(totalRecords / perPage),
      from: (page - 1) * perPage + 1,
      to: Math.min(page * perPage, totalRecords),
    },
  };
};

// List of Application Categories
applicantRouter.get("/all-applicants", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page) || 10;
  var page = parseInt(req.query.page) || 1;
  var offset = (page - 1) * per_page;
  var search_value = extractSearchValue(req);
  var sort_by = req.query.sort_by || "created_at";
  var sort_order = req.query.sort_order || "desc";
  var min_apps = req.query.min_applications || 0;
  var max_apps = req.query.max_applications || null;
	applicantModel.getAllApplicants(
	    offset,
	    per_page,
	    search_value,
	    sort_by,
	    sort_order,
	    min_apps,
	    max_apps,
	    (error, applicants, numRows) => {
	      return res.send({
	        error: error ? true : false,
	        statusCode: error ? 306 : 300,
	        ...formatApplicantResponse(applicants || [], numRows, page, per_page),
	        message: error ? "Something went wrong." : "List of Applicants.",
	      });
	    }
	  );
});

// Registry type summary (counts of users by resolved registry type)
applicantRouter.get("/all-applicants/registry-type-summary", isAuth, (req, res) => {
  const search_value = extractSearchValue(req);
  const min_apps = req.query.min_applications || 0;
  const max_apps = req.query.max_applications || null;

  applicantModel.getApplicantsRegistryTypeSummary(
    search_value,
    min_apps,
    max_apps,
    (error, summaryRows) => {
      return res.send({
        error: error ? true : false,
        statusCode: error ? 306 : 300,
        data: error ? [] : (summaryRows || []),
        message: error ? "Something went wrong." : "Registry type summary.",
      });
    }
  );
});
// Get applicant analytics/statistics
applicantRouter.get("/applicants-analytics", isAuth, (req, res, next) => {
  const startDate = req.query.start_date || null;
  const endDate = req.query.end_date || null;
  
  applicantModel.getApplicantStats(startDate, endDate, (error, stats) => {
    return res.send({
      error: error ? true : false,
      statusCode: error ? 306 : 300,
      data: error ? {} : stats,
      message: error ? "Something went wrong." : "Applicant statistics",
    });
  });
});

// Look for applicant
applicantRouter.get("/look_for_applicants", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var search = req.query.q || req.query.search || req.body.search || "";
  var exclude = req.query.exclude || req.body.exclude || "";
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
applicantRouter.get("/find-applicant/:id", isAuth, (req, res) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var applicant_id = req.params.id;
  applicantModel.findApplicant(
    offset,
    per_page,
    applicant_id,
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
          // schools: error ? [] : schools,
          // schoolsNumRows: schoolsNumRows,
          // attachments : error ? [] : attachments,
          // attachmentsNumRows : attachmentsNumRows
        },
        message: error ? "Something went wrong." : "Applicant",
      });
    }
  );
});
// List of Applicant
applicantRouter.get("/applicant-schools/:id", isAuth, (req, res) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var applicant_id = req.params.id;
  var search_value = extractSearchValue(req);
  applicantModel.getApplicantSchools(offset,per_page,applicant_id,search_value,(error,schools,numRows) => {
     console.log(applicant_id , numRows);
      return res.send({
        error: error ? true : false,
        statusCode: error ? 306 : 300,
        numRows: numRows,
        data : error ? [] : schools,
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

// Bulk transfer: set establishing_schools.applicant_id for registry_type_id=3 schools in a district
// Only affects schools created by the target user (applications.user_id = user_id).
const handleTransferGovernmentSchools = (req, res) => {
  const payload = {
    user_id: req.body?.user_id,
    applicant_id: req.body?.applicant_id,
    lga_code: req.body?.lga_code,
    registry_type_id: req.body?.registry_type_id,
  };

  applicantModel.transferGovernmentSchoolsToApplicant(payload, (error, result) => {
    if (error) {
      return res.send({
        error: true,
        statusCode: 306,
        schoolsUpdated: 0,
        applicationsUpdated: 0,
        message: error.message || "Something went wrong.",
      });
    }
    return res.send({
      error: false,
      statusCode: 300,
      schoolsUpdated: result?.schoolsUpdated || 0,
      applicationsUpdated: result?.applicationsUpdated || 0,
      message: "Transfer completed.",
    });
  });
};

applicantRouter.post(
  "/transfer-government-schools",
  isAuth,
  permission("update-schools"),
  handleTransferGovernmentSchools
);

// Backward compatible alias (old url)
applicantRouter.post(
  "/transfer-registry3-schools",
  isAuth,
  permission("update-schools"),
  handleTransferGovernmentSchools
);
module.exports = applicantRouter;
