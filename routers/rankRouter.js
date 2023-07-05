require("dotenv").config();
const express = require("express");
const request = require("request");
const rankRouter = express.Router();
const { isAuth, isAdmin , formatDate , permit } = require("../utils.js");
const rankModel = require("../models/rankModel.js");
var session = require("express-session");
rankRouter.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
// List of ranks
rankRouter.get("/allRanks", isAuth, (req, res, next) => {
  var per_page = parseInt(req.query.per_page);
  var page = parseInt(req.query.page);
  var offset = (page - 1) * per_page;
  var is_paginated = true;
        if (typeof req.body.is_paginated !== "undefined") {
            is_paginated = req.body.is_paginated == 'false' ? false : true;
        }
  rankModel.getAllRanks(offset, per_page, is_paginated , (error, ranks, numRows) => {
    // console.log(ranks)
            return res.send({
                error: error ? true : false,
                statusCode: error ? 306 : 300,
                data: error ? error : ranks,
                numRows: numRows,
                is_paginated : is_paginated,
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
            var data = [];
            var name = req.body.rankName.trim();
            var display = req.body.displayName.trim();
            data.push([
                    name.replace(/ /g, "-").toLowerCase(),
                    display,
                    1,
                    formatDate(new Date()),
                    req.user.id,
            ]);
    
            rankModel.storeRank(data , (error , success , result) => {
                     return res.send({
                       success: success ? true : false,
                       statusCode: success ? 300 : 306,
                       data: success ? result : error,
                       message: success
                         ? "Umefanikiwa kusajili rank."
                         : "Kuna shida tafadhali wasiliana na Msimamizi wa Mfumo. ",
                     });
            });
});

// Store rank
rankRouter.put("/updateRank/:id", isAuth, (req, res, next) => {
            var data = [];
            var name = req.body.rankName.trim().replace(/ /g, "-").toLowerCase();
            var display = req.body.displayName.trim();
            var status = req.body.status == "on" || req.body.status == 1 ? true : false ;
            var id = Number(req.params.id);
            data.push([
                        ,
                        display,
                        status,
                        id
            ]);
    
            rankModel.updateRank(name , display , status , id , (error , success , rank) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? rank : error,
                        message: success ? "Umefanikiwa kubadili rank." : "Kuna shida tafadhali wasiliana na Msimamizi wa Mfumo. ",
                     });
                    
            });
});

// Store rank
rankRouter.delete("/deleteRank/:id", isAuth, (req, res, next) => {
            var id = Number(req.params.id);
            rankModel.deleteRank(id , (error , success , rank) => {
                     return res.send({
                        success: success ? true : false,
                        statusCode: success ? 300 : 306,
                        data: success ? rank : error,
                        message: success ? "Umefanikiwa kufuta rank." : error,
                     });
                    
            });
});

module.exports = rankRouter;
