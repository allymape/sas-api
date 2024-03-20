require("dotenv").config();
const express = require("express");
const request = require("request");
const attachementTypeRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, paramCase, sentenceCase } = require("../utils.js");
var session = require("express-session");
const attachmentTypeModel = require("../models/attachmentTypeModel.js");
const sharedModel = require("../models/sharedModel.js");
attachementTypeRouter.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
// List of attachementTypes
attachementTypeRouter.get("/all-attachment-types", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var searchParams = req.body
  attachmentTypeModel.getAllAttachmentTypes(offset, per_page, searchParams, (error, attachementTypes, numRows) => {
           return res.send({
             error: error ? true : false,
             statusCode: error ? 306 : 300,
             data: attachementTypes,
             numRows: numRows,
             message: error
               ? "Something went wrong."
               : "List of Attachment Types.",
           });
  });
});
//attachement types filters
attachementTypeRouter.get("/filter-attachment-types", isAuth, (req, res) => {
            sharedModel.getApplicationCategories((categories) => {
               sharedModel.getRegistrationStructures( (structures) => {
                       sharedModel.getSchoolOwnerships((ownerships) => {
                            return res.send({
                              data: {
                                categories: categories,
                                structures: structures,
                                ownerships: ownerships,
                              }
                            });
                       });
               })
              
            })

});
// Edit AttachmentType
attachementTypeRouter.get("/edit-attachment-type/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  attachmentTypeModel.findAttachmentType(id, (error , success, attachementType) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? attachementType : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store attachementType
attachementTypeRouter.post("/add-attachment-type", isAuth, (req, res, next) => {
         const structure = req.body.structure;
         var formData = [];
             formData.push([
               req.body.jina_hati,
               req.body.ukubwa,
               req.body.file_format,
               req.body.aina_mwombaji,
               req.body.aina_ombi,
               structure ? structure : null,
               1,
               req.body.is_backend,
               formatDate(new Date()),
             ]);
            attachmentTypeModel.storeAttachmentTypes(formData , (error , success , result) => {
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

// Store attachementType
attachementTypeRouter.put("/update-attachment-type/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            const structure = req.body.structure;
            var formData = [
                      req.body.jina_hati,
                      req.body.ukubwa,
                      req.body.file_format,
                      req.body.aina_mwombaji,
                      req.body.aina_ombi,
                      structure ? structure : null,
                      req.body.hali,
                      req.body.is_backend,
                      id,
                ];

                console.log(req.body.is_backend);
              attachmentTypeModel.updateAttachmentType(id,formData, (error, success, attachementType) => {
                  return res.send({
                    success: success ? true : false,
                    statusCode: success ? 300 : 306,
                    data: success ? attachementType : error,
                    message: success
                      ? "Umefanikiwa kubadili Aina ya Kiambatisho."
                      : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                  });
                }
              );
});

// Store attachementType
attachementTypeRouter.delete("/delete-attachment-type/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            attachmentTypeModel.deleteAttachmentType(id , (error , success , attachementType) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? attachementType : error,
                        message: success ? "Umefanikiwa kufuta Attachement Type." : error,
                     });
                    
            });
});

module.exports = attachementTypeRouter;
