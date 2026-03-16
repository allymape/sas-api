const express = require("express");
const SchoolAPIController = require("../Controllers/SchoolAPIController");
const authMiddleware = require("../Middleware/AuthAPIMiddleware");

const router = express.Router();

router.get("/school-filters", authMiddleware, SchoolAPIController.schoolFilters);
router.get("/all-schools", authMiddleware, SchoolAPIController.allSchools);
router.get("/school-files", authMiddleware, SchoolAPIController.schoolFiles);
router.get("/look_for_schools", authMiddleware, SchoolAPIController.lookForSchools);
router.get("/edit-school/:id", authMiddleware, SchoolAPIController.editSchool);
router.put("/update-school/:id", authMiddleware, SchoolAPIController.updateSchool);
router.put("/update-school-file-number/:school_id", authMiddleware, SchoolAPIController.updateSchoolFileNumber);
router.get("/missing-school-file-numbers-count", authMiddleware, SchoolAPIController.missingSchoolFileNumbersCount);
router.post("/generate-missing-school-file-numbers", authMiddleware, SchoolAPIController.generateMissingSchoolFileNumbers);

module.exports = router;
