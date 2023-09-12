require("dotenv").config();
const express = require("express");
const request = require("request");
const anzishaShuleRequestRouter = express.Router();
const model = require("../../models/maombi/anzishaShuleRequestModel")
var session = require("express-session");

// List of 
anzishaShuleRequestRouter.post("/maombi-kuanzisha-shule",(req, res) => {
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
    model.anzishaShuleRequestList((error, data, numRows) => {
            return res.send({
                    error: error ? true : false,
                    statusCode: error ? 306 : 300,
                    data: error ? null : data,
                    numRows: numRows,
                    message: error ? "Something went wrong." : "List of maombi kuanzisha shule.",
                });
      }
    );
  }
);

module.exports = anzishaShuleRequestRouter;
