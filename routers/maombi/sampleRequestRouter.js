require("dotenv").config();
const express = require("express");
const db = require('../../dbConnection');
const request = require("request");
const sampleRequestRouter = express.Router();
const dateandtime = require("date-and-time");
var session = require("express-session");
const { isAuth, formatDate, permission, filterByUserLevel } = require("../../utils");

sampleRequestRouter.post( 
    "/maombi-usajili-shule", 
    isAuth, 
    permission('view-school-owners-and-managers'), 
(req, res) => {
    
});




//total application of the month


module.exports = sampleRequestRouter;
