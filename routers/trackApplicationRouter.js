require("dotenv").config();
const express = require("express");
const request = require("request");
const trackApplicationRouter = express.Router();
const { isAuth, permission } = require("../utils.js");
const trackApplicationModel = require("../models/trackApplicationModel.js");
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
    var is_paginated = true;
    if (typeof req.body.is_paginated !== "undefined") {
      is_paginated =
        req.body.is_paginated == "false" || !req.body.is_paginated
          ? false
          : true;
    }
    trackApplicationModel.getAllApplications(
      offset,
      per_page,
      is_paginated,
      (error, applications, numRows) => {
        console.log(applications);
        return res.send({
          error: error ? true : false,
          statusCode: error ? 306 : 300,
          data: error ? "" : applications,
          numRows: numRows,
          is_paginated: is_paginated,
          message: error ? "Something went wrong." : "List of applications.",
        });
      }
    );
  }
);

module.exports = trackApplicationRouter;
