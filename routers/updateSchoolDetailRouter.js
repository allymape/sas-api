require("dotenv").config();
const express = require("express");
const updateSchoolDetailRouter = express.Router();
const { isAuth } = require("../utils.js");
const schoolModel = require("../models/schoolModel.js");
const updateSchoolDetailModel = require("../models/updateSchoolDetailModel.js");

// Edit Shule
updateSchoolDetailRouter.get("/edit-school-detail/:tracking_number/edit", isAuth, (req, res) => {
    updateSchoolDetailModel.getSchoolInfo(req.params.tracking_number , (schoolInfo) => {
        console.log(schoolInfo)
        res.send({
          school_info: schoolInfo,
        });
    })
});
module.exports = updateSchoolDetailRouter;
