const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/AuthAPIMiddleware");
const ReligionAPIController = require("../Controllers/ReligionAPIController");

router.get("/religions", authMiddleware, ReligionAPIController.getReligions);
router.get("/religions/:id/sect-names", authMiddleware, ReligionAPIController.getSectNamesByReligion);
router.get("/religions/:id", authMiddleware, ReligionAPIController.getReligionById);
router.post("/religions", authMiddleware, ReligionAPIController.createReligion);
router.put("/religions/:id", authMiddleware, ReligionAPIController.updateReligion);
router.delete("/religions/:id", authMiddleware, ReligionAPIController.deleteReligion);

router.get("/sect-names", authMiddleware, ReligionAPIController.getSectNames);
router.get("/sect-names/:id", authMiddleware, ReligionAPIController.getSectNameById);
router.post("/sect-names", authMiddleware, ReligionAPIController.createSectName);
router.put("/sect-names/:id", authMiddleware, ReligionAPIController.updateSectName);
router.delete("/sect-names/:id", authMiddleware, ReligionAPIController.deleteSectName);

module.exports = router;

