const express = require("express");
const router = express.Router();
const controller = require("../controllers/candidate.controller");
const {
  parseFormFields,
  parseResumeUpload,
  handleMulterError,
} = require("../middleware/upload");
const { mountStaffAccess } = require("../middleware/routeGuards");
const { presignedPatchChain } = require("../middleware/presignedPatch");

mountStaffAccess(router);

router.post(
  "/parse-resume",
  parseResumeUpload,
  handleMulterError,
  controller.parseResume,
);
router.post("/", parseFormFields, controller.create);
router.get("/", controller.list);
router.get("/available", controller.getAvailable);
router.get("/export", controller.exportList);
router.get("/:id", controller.getById);
router.patch("/:id", ...presignedPatchChain, controller.updateById);
router.patch("/:id/toggle-status", controller.toggleStatus);
router.patch("/:id/update-status", controller.updateStatus);
router.post("/bulk-import", controller.bulkImport);

module.exports = router;
