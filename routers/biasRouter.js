require("dotenv").config();
const express = require("express");
const request = require("request");
const biasRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");
const biasModel = require("../models/biasModel.js");
var session = require("express-session");

// List of biases
biasRouter.get("/allBiases", isAuth, permission('view-biases'), (req, res, next) => {
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
  biasModel.getAllBiases(offset, per_page, is_paginated , (error, biases, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? null : biases,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of Michepuo.",
            });
  });
});
// Edit Combination
biasRouter.get("/editCombination/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  biasModel.findCombination(id, (error , success, bias) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? bias : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store bias
biasRouter.post("/addBias", isAuth, (req, res, next) => {
            var formData = [];
            var name = req.body.name;
            formData.push([
                    name,
                    1,
                    formatDate(new Date()),
                    formatDate(new Date())
            ]);
    
            biasModel.storeBias(formData , (error , success , result) => {
                     return res.send({
                       success: success ? true : false,
                       statusCode: success ? 300 : 306,
                       data: success ? result : error,
                       message: success
                         ? "Umefanikiwa kusajili Michepuo."
                         : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
            });
});

// Store bias
biasRouter.put("/updateBias/:id", isAuth, (req, res, next) => {
            var formData = [];
            var name = req.body.name;
            var id = Number(req.params.id);
            formData.push(name,id);
    
            biasModel.updateBias( formData , (error , success , bias) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? bias : error,
                        message: success ? "Umefanikiwa kubadili Michepuo." : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store bias
biasRouter.put("/deleteCombination/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            biasModel.deleteCombination(id , (error , success , bias) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? bias : [],
                        message: success ? "Umefanikiwa kufuta Michepuo." : 'Haujafanikiwa kufuta kuna Tatizo, Tafadhali hakiki kama Michepuo hii haijatumika kwanza',
                     });
                    
            });
});

module.exports = biasRouter;
