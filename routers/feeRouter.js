require("dotenv").config();
const express = require("express");
const request = require("request");
const feeRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");
const feeModel = require("../models/feeModel.js");

// List of fees
feeRouter.get("/allFees", isAuth, permission('view-fees'), (req, res, next) => {
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
  feeModel.getAllFees(offset, per_page, is_paginated , (error, fees, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? error : fees,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of Fees.",
            });
  });
});
// Edit Fee
feeRouter.get("/editFee/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  feeModel.findFee(id, (error , success, fee) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? fee : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store fee
feeRouter.post("/addFee", isAuth, (req, res, next) => {
            var formData = [];
            var name = req.body.feename;
            var code = req.body.feecode;
            formData.push([
                    name,
                    formatDate(new Date()),
                    formatDate(new Date())
            ]);
    
            feeModel.storeFee(formData , (error , success , result) => {
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

// Store fee
feeRouter.put("/updateFee/:id", isAuth, (req, res, next) => {
            var formData = [];
            var name = req.body.feename;
            var fee_code = req.body.feecode;
            var status = req.body.statusid == "on" || Number(req.body.statusid) == 1 ? true : false ;
            var id = Number(req.params.id);
            formData.push(name,status,id);
    
            feeModel.updateFee( formData , (error , success , fee) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? fee : error,
                        message: success ? "Umefanikiwa kubadili Ngazi." : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store fee
feeRouter.put("/deleteFee/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            feeModel.deleteFee(id , (error , success , fee) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? fee : [],
                        message: success ? "Umefanikiwa kufuta Ngazi." : 'Haujafanikiwa kufuta kuna Tatizo, Tafadhali hakiki kama Ngazi hii haijatumika kwanza',
                     });
                    
            });
});

module.exports = feeRouter;
