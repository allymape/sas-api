require("dotenv").config();
const express = require("express");
const request = require("request");
var trackApplicationRouter = express.Router();
const { isAuth, permission, auditTrail } = require("../utils.js");
const trackApplicationModel = require("../models/trackApplicationModel.js");
const sharedModel = require("../models/sharedModel.js");

const normalizeSearchValue = (value) => {
  if (value && typeof value === "object") {
    return String(value.value || "").trim();
  }

  return String(value || "").trim();
};
//
// List of applications
trackApplicationRouter.get(
  "/track_applications",
  isAuth,
  permission("view-track-application"),
  (req, res) => {
    var per_page = parseInt(req.query.per_page);
    var page = parseInt(req.query.page);
    var offset = (page - 1) * per_page;
    var search_value = normalizeSearchValue(
      (req.body && req.body.search) ||
      req.query.search ||
      req.query.search_value ||
      ""
    );
    var school_id =
      req.query.school_id !== undefined && req.query.school_id !== ""
        ? Number(req.query.school_id)
        : req.body && req.body.school_id !== undefined && req.body.school_id !== ""
          ? Number(req.body.school_id)
          : null;
    const filter = String(req.query.filter || (req.body && req.body.filter) || "").trim();
    const user = req.user;
    // sharedModel.getApplicationCategories((categories) => {
      trackApplicationModel.getAllApplications(
        offset,
        per_page,
        search_value,
        school_id,
        filter,
        user,
        (error, applications, numRows, summary) => {
          const data = applications.map((item) => ({
            ...item,
            office: user.office,
          }));
          return res.send({
            error: error ? true : false,
            statusCode: error ? 306 : 300,
            data: data,
            numRows: numRows,
            summary: summary,
            message: error ? "Something went wrong." : "List of applications.",
          });
        }
      );
    // });
  }
);

trackApplicationRouter.get(`/application_comments/:tracking_number` , isAuth , permission('view-track-application') , (req, res) => {
     const tracking_number = req.params.tracking_number
      sharedModel.myMaoni( tracking_number , (comments) => {
            res.send({
            data : comments,
            message : 'List ya Maoni'
          })
      })
});

trackApplicationRouter.put(`/update_payment` , isAuth , permission('view-track-application') , (req, res) => {
     const tracking_number = req.body.tracking_number
      sharedModel.updateApplicationPayment( tracking_number , (success , updatedData) => {
            if(success){
              auditTrail(req, 'edit' , 'Badili Malipo' , 'Track Application')
            }
            res.send({
            statusCode : success ? 300 : 306,
            message : success ? 'Umefanikiwa kulipia ombi hili' : 'Haujafanikiwa kulipia ombi hili kuna tatizo.',
          })
      })
});

module.exports = trackApplicationRouter;
