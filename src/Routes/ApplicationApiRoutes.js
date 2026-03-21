// Src/Routes/ApplicationRoutes.js
const express = require("express");
const router = express.Router();
const ApplicationController = require("../Controllers/ApplicationAPIController.js");

// Middleware ya authentication (assuming una auth middleware)
const authMiddleware = require("../Middleware/AuthAPIMiddleware.js");

// ------------------------------
// Application Routes
// ------------------------------
router.get('/', authMiddleware, ApplicationController.getAllApplications);
router.get('/my-applications', authMiddleware, ApplicationController.getMyApplications);
router.get('/:trackingNumber', authMiddleware, ApplicationController.getApplicationByTrackingNumber);
router.post('/:trackingNumber/comment', authMiddleware, ApplicationController.addComment);
router.post('/:trackingNumber/advance', authMiddleware, ApplicationController.advanceWorkflow);
router.post('/:trackingNumber/start', authMiddleware, ApplicationController.startWorkflow);

module.exports = router;
