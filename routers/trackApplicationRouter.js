require("dotenv").config();
const express = require("express");
const request = require("request");
var trackApplicationRouter = express.Router();
const { isAuth, permission, auditTrail } = require("../utils.js");
const trackApplicationModel = require("../models/trackApplicationModel.js");
const sharedModel = require("../models/sharedModel.js");
//
// List of applications
trackApplicationRouter.get(
  "/track_applications/:application",
  isAuth,
  permission("view-track-application"),
  (req, res) => {
    var per_page = parseInt(req.query.per_page);
    var page = parseInt(req.query.page);
    var offset = (page - 1) * per_page;
    var is_paginated = true;
    const application_categroy_id = req.params.application;
    if (typeof req.body.is_paginated !== "undefined") {
      is_paginated =
        req.body.is_paginated == "false" || !req.body.is_paginated
          ? false
          : true;
    }
    const searchQuery = req.body;
    const user = req.user;
    sharedModel.getApplicationCategories((categories) => {
      trackApplicationModel.getAllApplications(
        offset,
        per_page,
        is_paginated,
        searchQuery,
        application_categroy_id,
        user,
        (error, applications, numRows) => {
          return res.send({
            error: error ? true : false,
            statusCode: error ? 306 : 300,
            data: { applications, categories },
            numRows: numRows,
            is_paginated: is_paginated,
            message: error ? "Something went wrong." : "List of applications.",
          });
        }
      );
    });
  }
);

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
