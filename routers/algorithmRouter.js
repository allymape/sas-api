require("dotenv").config();
const express = require("express");
const request = require("request");
const algorithmRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");

var session = require("express-session");
const algorithmModel = require("../models/algorithmModel.js");
algorithmRouter.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
// List of Algorithms
algorithmRouter.get("/all-algorithms", isAuth, permission('view-algorithm'), (req, res, next) => {
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
  algorithmModel.getAllAlgorithms(offset, per_page, is_paginated , (error, Algorithms, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? error : Algorithms,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of Algorithms.",
            });
  });
});
// Edit Algorithm
algorithmRouter.get("/editAlgorithm/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  algorithmModel.findAlgorithm(id, (error , success, Algorithm) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? Algorithm : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store Algorithm
algorithmRouter.post("/generateNumber", isAuth, (req, res, next) => {
            algorithmModel.storeAlgorithm((success) => {
                   console.log(success)
                     return res.send({
                       success: true,
                       statusCode: 300,
                     });
            });
});

// Store Algorithm
algorithmRouter.put("/updateAlgorithm/:id", isAuth, (req, res, next) => {
           
            var last_number = req.body.last_number;
            var id = Number(req.params.id);
           
            algorithmModel.updateAlgorithm( id , last_number , (error , success , algorithm , invalid = false) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? algorithm : [],
                        message: success ?  "Umefanikiwa kubadili namba ya usajili." : (invalid ? 'Namba ya usajili haipaswi kuwa ndogo ya inayobadilishwa.' :"Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. "),
                     });
                    
            });
});

// Store Algorithm
algorithmRouter.put("/deleteAlgorithm/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            algorithmModel.deleteAlgorithm(id , (error , success , Algorithm) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? Algorithm : [],
                        message: success ? "Umefanikiwa kufuta Kanda." : 'Haujafanikiwa kufuta kuna Tatizo, Tafadhali hakiki kama Kanda hii haijatumika kwanza',
                     });
                    
            });
});

module.exports = algorithmRouter;
