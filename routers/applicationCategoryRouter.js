require("dotenv").config();
const express = require("express");
const request = require("request");
const applicationCategoryRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, paramCase, sentenceCase } = require("../utils.js");
const applicationCategoryModel = require("../models/applicationCategoryModel.js");
// List of Application Categories
applicationCategoryRouter.get("/all-application-categories", isAuth, (req, res, next) => {
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
  applicationCategoryModel.getAllApplicationCategories(offset, per_page, is_paginated, (error, applicationCategorys, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? [] : applicationCategorys,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of Application Types.",
            });
  });
});
// Edit Application Category
applicationCategoryRouter.get("/edit-application-category/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  applicationCategoryModel.findApplicationCategory(id, (error , success, applicationCategory) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? applicationCategory : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store Application Category
applicationCategoryRouter.post("/add-application-category", isAuth, (req, res, next) => {
            var data = [];
            var name = paramCase(req.body.applicationCategoryName);
            var display = sentenceCase(req.body.displayName);
            data.push([
                    name,
                    display,
                    1,
                    formatDate(new Date()),
                    req.user.id,
            ]);
    
            applicationCategoryModel.storeApplicationCategory(data , (error , success , result) => {
                     return res.send({
                       success: success ? true : false,
                       statusCode: success ? 300 : 306,
                       data: success ? result : error,
                       message: success
                         ? "Umefanikiwa kusajili Attachement Type."
                         : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
            });
});

// Store Application Category
applicationCategoryRouter.put("/update-application-category/:id", isAuth, (req, res, next) => {
            var name = paramCase(req.body.applicationCategoryName);
            var display = sentenceCase(req.body.displayName);
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var id = Number(req.params.id);
            
            applicationCategoryModel.updateApplicationCategory(name , display , status , id , (error , success , applicationCategory) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? applicationCategory : error,
                        message: success ? "Umefanikiwa kubadili Attachement Type." : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store Application Category
applicationCategoryRouter.delete("/delete-application-category/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            applicationCategoryModel.deleteApplicationCategory(id , (error , success , applicationCategory) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? applicationCategory : error,
                        message: success ? "Umefanikiwa kufuta Attachement Type." : error,
                     });
                    
            });
});

module.exports = applicationCategoryRouter;
