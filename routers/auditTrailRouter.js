require("dotenv").config();
const express = require("express");
const db = require("../../dbConnection");
const auditTrailRouter = express.Router();
const { isAuth, formatDate, applicationView } = require("../../utils");

// List of
auditTrailRouter.post("audit-trail",isAuth, (req, res) => {  
});

module.exports = auditTrailRouter;
