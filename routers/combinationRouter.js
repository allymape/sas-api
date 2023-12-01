require("dotenv").config();
const express = require("express");
const request = require("request");
const combinationRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");
const combinationModel = require("../models/combinationModel.js");
var session = require("express-session");

// List of combinations
combinationRouter.get("/allCombinations", isAuth, permission('view-combinations'), (req, res, next) => {
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
  combinationModel.getAllCombinations(offset, per_page, is_paginated , (error, combinationes, specializations, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                combinationes: error ? error : combinationes,
                specializations : specializations,
                numRows: numRows,
                message: error ? "Kuna Tatizo limetokea." : "Orosha ya Tahasusi.",
            });
  });
});
// Edit Combination
combinationRouter.get("/editCombination/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  combinationModel.findCombination(id, (error , success, combination) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? combination : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store combination
combinationRouter.post("/addCombination", isAuth, (req, res, next) => {
            var formData = [];
            var combination = req.body.name;
            var school_specialization_id = req.body.school_specialization_id;
            formData.push([
                    combination,
                    school_specialization_id,
                    formatDate(new Date()),
                    formatDate(new Date())
            ]);
    
            combinationModel.storeCombination(formData , (error , success , result) => {
                     return res.send({
                       success: success ? true : false,
                       statusCode: success ? 300 : 306,
                       data: success ? result : error,
                       message: success
                         ? "Umefanikiwa kusajili Ngazi."
                         : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
            });
});

// Store combination
combinationRouter.put("/updateCombination/:id", isAuth, (req, res, next) => {
            var formData = [];
            var name = req.body.name;
            var school_specialization_id = Number(req.body.school_specialization_id);
            // var status = req.body.statusid == "on" || Number(req.body.statusid) == 1 ? true : false ;
            var id = Number(req.params.id);
            formData.push(name, school_specialization_id, id);
    
            combinationModel.updateCombination( formData , (error , success , combination) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? combination : error,
                        message: success ? "Umefanikiwa kubadili Tahasusi" : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store combination
combinationRouter.put("/deleteCombination/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            combinationModel.deleteCombination(id , (error , success , combination) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? combination : [],
                        message: success ? "Umefanikiwa kufuta Ngazi." : 'Haujafanikiwa kufuta kuna Tatizo, Tafadhali hakiki kama Ngazi hii haijatumika kwanza',
                     });
                    
            });
});

module.exports = combinationRouter;
