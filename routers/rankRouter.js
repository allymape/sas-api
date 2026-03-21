require("dotenv").config();
const express = require("express");
const request = require("request");
const rankRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit, permission } = require("../utils.js");
const rankModel = require("../models/rankModel.js");
// List of ranks
rankRouter.get("/allRanks", isAuth, permission('view-ranks'), (req, res, next) => {
  const per_page = Number.parseInt(req.query.per_page, 10) || 10;
  const page = Number.parseInt(req.query.page, 10) || 1;
  const offset = (page - 1) * per_page;
  let is_paginated = true;
  if (typeof req.body?.is_paginated !== "undefined") {
    is_paginated =
      req.body.is_paginated == "false" || !req.body.is_paginated ? false : true;
  }
  rankModel.getAllRanks(offset, per_page, is_paginated , (error, ranks, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? error : ranks,
                numRows: numRows,
                message: error ? "Something went wrong." : "List of Ranks.",
            });
  });
});
// List of ranks lookup
rankRouter.get("/ranks", isAuth, (req, res, next) => {
  const {user} = req
  rankModel.lookupRanks(user , (error, ranks, numRows) => {
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? error : ranks,
                message: error ? "Something went wrong." : "List of Ranks.",
            });
  });
});
// Edit Rank
rankRouter.get("/editRank/:id", isAuth, (req, res, next) => {
    var id = req.params.id;
  rankModel.findRank(id, (error , success, rank) => {
            return res.send({
                success: success ? true : false,
                statusCode: success ? 300 : 306,
                data: success ? rank : error,
                message: success ?  "Success" : "Not found",
            });
  });
});

// Store rank
rankRouter.post("/addRank", isAuth, (req, res, next) => {
            var formData = [];
            var name = req.body.rankname;
            var code = req.body.rankcode;
            formData.push([
                    name,
                    formatDate(new Date()),
                    formatDate(new Date())
            ]);
    
            rankModel.storeRank(formData , (error , success , result) => {
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

// Store rank
rankRouter.put("/updateRank/:id", isAuth, (req, res, next) => {
            var formData = [];
            var name = req.body.rankname;
            var rank_code = req.body.rankcode;
            var status = req.body.statusid == "on" || Number(req.body.statusid) == 1 ? true : false ;
            var id = Number(req.params.id);
            formData.push(name,status,id);
    
            rankModel.updateRank( formData , (error , success , rank) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? rank : error,
                        message: success ? "Umefanikiwa kubadili Ngazi." : "Kuna shida tafadhali wasiliana na Misimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store rank
rankRouter.put("/deleteRank/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            rankModel.deleteRank(id , (error , success , rank) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? rank : [],
                        message: success ? "Umefanikiwa kufuta Ngazi." : 'Haujafanikiwa kufuta kuna Tatizo, Tafadhali hakiki kama Ngazi hii haijatumika kwanza',
                     });
                    
            });
});

module.exports = rankRouter;
