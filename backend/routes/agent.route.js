const express = require("express");
const router = express.Router();
const controller = require("../controllers/agent.controller");
const { verifyToken } = require("../middleware/VerifyToken");
const { authorize, checkAgencyStatus } = require("../middleware/authorization");
const { autoInjectTenantData } = require("../middleware/autoInjectTenantData");

router.use(verifyToken);
router.use(authorize("AGENCY_ADMIN", "SUPER_ADMIN"));
router.use((req, res, next) => {
  if (req.user.role === "SUPER_ADMIN") {
    return next();
  }
  return checkAgencyStatus(req, res, next);
});

router.use(
  autoInjectTenantData({
    includeAgencyId: true,
    includeCreatedBy: true,
    includeIndustryType: true,
    allowOverride: false,
  })
);

// Create agent
router.post("/", controller.create);

// List agents for agency
router.get("/", controller.list);

// Get single agent
router.get("/:id", controller.getById);

// Update agent
router.put("/:id", controller.updateById);

// Toggle agent active status
router.patch("/:id/toggle-status", controller.toggleStatus);

// Reset agent password
router.post("/:id/reset-password", controller.resetPassword);

module.exports = router;