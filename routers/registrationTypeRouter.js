require("dotenv").config();
const express = require("express");
const request = require("request");
const registrationTypeRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, paramCase, sentenceCase } = require("../utils.js");
var session = require("express-session");
const registrationTypeModel = require("../models/registrationTypeModel.js");
registrationTypeRouter.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
// List of Registration Type
registrationTypeRouter.get("/all-registration-types", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
   var is_paginated = true;
   if (typeof req.body.is_paginated !== "undefined") {
     is_paginated = req.body.is_paginated == "false" ? false : true;
   }
  registrationTypeModel.getAllRegistrationTypes(offset, per_page, is_paginated, (error, registrationTypes, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? [] : registrationTypes,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of Attachment Types.",
            });
  });
});
// Edit Registration Type
registrationTypeRouter.get("/edit-registration-type/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  registrationTypeModel.findRegistrationType(id, (error , success, registrationType) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? registrationType : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store Registration Type
registrationTypeRouter.post("/add-registration-type", isAuth, (req, res, next) => {
            var data = [];
            var name = paramCase(req.body.registrationTypeName);
            var display = sentenceCase(req.body.displayName);
            data.push([
                    name,
                    display,
                    1,
                    formatDate(new Date()),
                    req.user.id,
            ]);
    
            registrationTypeModel.storeRegistrationType(data , (error , success , result) => {
                     return res.send({
                       success: success ? true : false,
                       statusCode: success ? 300 : 306,
                       data: success ? result : error,
                       message: success
                         ? "Umefanikiwa kusajili Registration Type."
                         : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
            });
});

// Store registrationType
registrationTypeRouter.put("/update-registration-type/:id", isAuth, (req, res, next) => {
            var name = paramCase(req.body.registrationTypeName);
            var display = sentenceCase(req.body.displayName);
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var id = Number(req.params.id);
            
            registrationTypeModel.updateRegistrationType(name , display , status , id , (error , success , registrationType) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? registrationType : error,
                        message: success ? "Umefanikiwa kubadili Registration Type." : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store Registration Type
registrationTypeRouter.delete("/delete-registration-type/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            registrationTypeModel.deleteRegistrationType(id , (error , success , registrationType) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? registrationType : error,
                        message: success ? "Umefanikiwa kufuta Registration Type." : error,
                     });
                    
            });
});

module.exports = registrationTypeRouter;
