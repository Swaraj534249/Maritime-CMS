const express = require("express");
const router = express.Router();
const controller = require("../controllers/agent.controller");
const { verifyToken } = require("../middleware/VerifyToken");
const { authorize, checkAgencyStatus } = require("../middleware/authorization");

// All routes require authentication and AGENCY_ADMIN role
router.use(verifyToken);
router.use(authorize("AGENCY_ADMIN"));
router.use(checkAgencyStatus); // Ensure agency is active

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