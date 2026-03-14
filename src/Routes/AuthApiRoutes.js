const express = require("express");
const router = express.Router();
const AuthAPIController = require("../Controllers/AuthAPIController");
const authMiddleware = require("../Middleware/AuthAPIMiddleware");

router.post("/login", AuthAPIController.login);
router.post("/logout", authMiddleware, AuthAPIController.logout);

module.exports = router;
