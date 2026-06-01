const express = require("express");
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/VerifyToken");
const { requireSelfOrSuperAdmin } = require("../middleware/requireSelfOrSuperAdmin");
const { applyPresignedUploads } = require("../middleware/applyPresignedUploads");
const router = express.Router();

router.use(verifyToken);

router.get("/", userController.getAll);
router.get("/:id", requireSelfOrSuperAdmin, userController.getById);
router.patch("/:id", requireSelfOrSuperAdmin, userController.updateById);
router.patch(
  "/:id/profile",
  requireSelfOrSuperAdmin,
  applyPresignedUploads,
  userController.updateProfile,
);
router.post(
  "/:id/complete-onboarding",
  requireSelfOrSuperAdmin,
  applyPresignedUploads,
  userController.completeOnboarding,
);

module.exports = router;
