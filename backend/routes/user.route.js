const express = require("express");
const userController = require("../controllers/user.controller");
const { requireSelfOrSuperAdmin } = require("../middleware/requireSelfOrSuperAdmin");
const { applyPresignedUploads } = require("../middleware/applyPresignedUploads");
const { validatePresignedUploads } = require("../middleware/validatePresignedUploads");
const { authorize } = require("../middleware/authorization");
const router = express.Router();

router.get(
  "/",
  authorize("SUPER_ADMIN"),
  userController.getAll,
);
router.get("/:id", requireSelfOrSuperAdmin, userController.getById);
router.patch("/:id", requireSelfOrSuperAdmin, userController.updateById);
router.patch(
  "/:id/profile",
  requireSelfOrSuperAdmin,
  applyPresignedUploads,
  validatePresignedUploads,
  userController.updateProfile,
);
router.post(
  "/:id/complete-onboarding",
  requireSelfOrSuperAdmin,
  applyPresignedUploads,
  validatePresignedUploads,
  userController.completeOnboarding,
);

module.exports = router;
