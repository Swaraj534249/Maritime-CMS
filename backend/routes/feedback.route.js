const express = require("express");
const router = express.Router();
const controller = require("../controllers/feedback.controller");
const { authorize } = require("../middleware/authorization");
const { skipAgencyCheckForSuperAdmin } = require("../middleware/routeGuards");
const multer = require("multer");

const feedbackUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const feedbackRoles = authorize("SUPER_ADMIN", "AGENCY_ADMIN", "AGENT");
const submitRoles = authorize("AGENCY_ADMIN", "AGENT");

router.post(
  "/",
  submitRoles,
  skipAgencyCheckForSuperAdmin,
  feedbackUpload.array("attachments", 5),
  controller.submit,
);

router.get("/", feedbackRoles, skipAgencyCheckForSuperAdmin, controller.list);
router.get("/:id", feedbackRoles, skipAgencyCheckForSuperAdmin, controller.getById);
router.patch(
  "/:id",
  feedbackRoles,
  skipAgencyCheckForSuperAdmin,
  feedbackUpload.array("attachments", 5),
  controller.updateById,
);

module.exports = router;
