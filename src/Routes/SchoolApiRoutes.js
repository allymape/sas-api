const express = require("express");
const SchoolAPIController = require("../Controllers/SchoolAPIController");
const authMiddleware = require("../Middleware/AuthAPIMiddleware");

const router = express.Router();

router.get("/school-filters", authMiddleware, SchoolAPIController.schoolFilters);
router.get("/all-schools", authMiddleware, SchoolAPIController.allSchools);
router.get("/look_for_schools", authMiddleware, SchoolAPIController.lookForSchools);
router.get("/edit-school/:id", authMiddleware, SchoolAPIController.editSchool);
router.put("/update-school/:id", authMiddleware, SchoolAPIController.updateSchool);

module.exports = router;
