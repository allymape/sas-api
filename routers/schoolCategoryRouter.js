require("dotenv").config();
const express = require("express");
const schoolCategoryRouter = express.Router();
const { isAuth , permission } = require("../utils.js");
const schoolCategoryModel = require("../models/schoolCategoryModel.js");

// List of fees
schoolCategoryRouter.get("/all-school-categories", isAuth, permission('view-algorithm'), (req, res) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var is_paginated = false;
        if (typeof req.body.is_paginated !== "undefined") {
            is_paginated =
              req.body.is_paginated == "false" || !req.body.is_paginated
                ? false
                : true;
        }
  schoolCategoryModel.getAllCategories(offset, per_page, is_paginated , (error, categories, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? [] : categories,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of School Categories.",
            });
  });
});


module.exports = schoolCategoryRouter;
