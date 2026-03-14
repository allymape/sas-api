const express = require("express");
const router = express.Router();

// Mount all modules here
router.use("/", require("./AuthApiRoutes"));
router.use("/", require("./DashboardApiRoutes"));
router.use("/applications", require("./ApplicationApiRoutes"));
router.use("/", require("./SchoolApiRoutes"));
router.use("/", require("./UserApiRoutes"));
router.use("/", require("./LegacyCompatRoutes"));

module.exports = router;
