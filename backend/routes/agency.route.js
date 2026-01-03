const express = require("express");
const router = express.Router();
const controller = require("../controllers/agency.controller");
const { verifyToken } = require("../middleware/VerifyToken");
const {
  authorize,
  checkAgencyAccess,
  checkAgencyStatus,
} = require("../middleware/authorization");

// Create agency (public or SUPER_ADMIN only)
router.post("/", controller.create);

// List agencies
router.get(
  "/",
  verifyToken,
  authorize("SUPER_ADMIN"),
  controller.list
);

// Get agency by ID
router.get("/:id", verifyToken, checkAgencyAccess, controller.getById);

// Update agency (AGENCY_ADMIN or SUPER_ADMIN)
router.patch(
  "/:id",
  verifyToken,
  authorize("AGENCY_ADMIN", "SUPER_ADMIN"),
  checkAgencyAccess,
  controller.updateById
);

// Toggle agency status (SUPER_ADMIN only)
router.patch(
  "/:id/toggle-status",
  verifyToken,
  authorize("SUPER_ADMIN"),
  controller.toggleStatus
);

module.exports = router;