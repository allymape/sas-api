const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/AuthAPIMiddleware");
const DashboardAPIController = require("../Controllers/DashboardAPIController");

router.get("/school-summaries", authMiddleware, DashboardAPIController.schoolSummaries);
router.get("/dashboard-filters", authMiddleware, DashboardAPIController.dashboardFilters);
router.get("/map-data", authMiddleware, DashboardAPIController.mapData);
router.post("/update-marker", authMiddleware, DashboardAPIController.updateMarker);
router.get(
  "/schools-summary-by-regions-and-categories",
  authMiddleware,
  DashboardAPIController.schoolsSummaryByRegionsAndCategories,
);
router.get(
  "/number-of-schools-by-year-of-regitration",
  authMiddleware,
  DashboardAPIController.numberOfSchoolsByYear,
);
router.get(
  "/registered-schools-by-period",
  authMiddleware,
  DashboardAPIController.registeredSchoolsByPeriod,
);

module.exports = router;
