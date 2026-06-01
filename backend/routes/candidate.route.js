const express = require("express");
const router = express.Router();
const controller = require("../controllers/candidate.controller");
const { verifyToken } = require("../middleware/VerifyToken");
const { authorize, checkAgencyStatus } = require("../middleware/authorization");
const {
  parseFormFields,
  parseResumeUpload,
  handleMulterError,
} = require("../middleware/upload");
const { applyPresignedUploads } = require("../middleware/applyPresignedUploads");

router.use(verifyToken);
router.use(authorize("AGENT", "AGENCY_ADMIN", "SUPER_ADMIN"));

router.use((req, res, next) => {
  if (req.user.role === "SUPER_ADMIN") {
    return next();
  }
  return checkAgencyStatus(req, res, next);
});

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
router.patch(
  "/:id",
  parseFormFields,
  applyPresignedUploads,
  controller.updateById,
);
router.patch("/:id/toggle-status", controller.toggleStatus);
router.patch("/:id/update-status", controller.updateStatus);
router.post("/bulk-import", controller.bulkImport);

module.exports = router;
