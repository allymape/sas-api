const express = require("express");
const router = express.Router();
const authMiddleware = require("../Middleware/AuthAPIMiddleware");
const UserAPIController = require("../Controllers/UserAPIController");

const requirePermission = (permissionName) => (req, res, next) => {
  const permissions = req.user?.userPermissions || [];
  if (!permissions.includes(permissionName)) {
    return res.status(403).send({ statusCode: 403, message: "403 Forbidden" });
  }
  next();
};

router.get("/users", authMiddleware, requirePermission("view-users"), UserAPIController.getUsers);
router.get("/users/:id", authMiddleware, requirePermission("update-users"), UserAPIController.findUser);
router.post("/create-user", authMiddleware, requirePermission("create-users"), UserAPIController.createUser);
router.put("/update-user/:id", authMiddleware, requirePermission("update-users"), UserAPIController.updateUser);
router.put("/activate-deactivate-user/:id", authMiddleware, requirePermission("delete-users"), UserAPIController.activateDeactivateUser);
router.post("/my-profile", authMiddleware, UserAPIController.myProfile);
router.put("/update-my-profile", authMiddleware, requirePermission("update-profile"), UserAPIController.updateMyProfile);
router.put("/change-my-password", authMiddleware, requirePermission("update-profile"), UserAPIController.changeMyPassword);
router.post("/reset-user-password", UserAPIController.resetUserPassword);
router.post("/refresh_token", authMiddleware, UserAPIController.refreshToken);
router.get("/roles", authMiddleware, UserAPIController.lookupRoles);
router.get("/ranks", authMiddleware, UserAPIController.lookupRanks);
router.get("/hierarchies_by_ranks", authMiddleware, UserAPIController.lookupHierarchiesByRanks);
router.get("/lookup-zones", authMiddleware, UserAPIController.lookupZones);
router.get("/designations_by_section", authMiddleware, UserAPIController.lookupDesignationsBySection);

module.exports = router;
