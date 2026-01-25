const express = require("express");
const router = express.Router();
const controller = require("../controllers/candidate.controller");
const { verifyToken } = require("../middleware/VerifyToken");
const { authorize, checkAgencyStatus } = require("../middleware/authorization");
const { autoInjectTenantData } = require("../middleware/autoInjectTenantData");
const {
  uploadCandidateFiles,
  handleMulterError,
  uploadSingle,
} = require("../middleware/upload");

router.use(verifyToken);
router.use(authorize("AGENT", "AGENCY_ADMIN", "SUPER_ADMIN"));

// Check agency status for non-super-admin users
router.use((req, res, next) => {
  if (req.user.role === "SUPER_ADMIN") {
    return next();
  }
  return checkAgencyStatus(req, res, next);
});

// PARSE RESUME ENDPOINT - Add this before other routes
router.post(
  "/parse-resume",
  uploadSingle("resume"),
  handleMulterError,
  controller.parseResume
);
router.post("/", uploadCandidateFiles, handleMulterError, controller.create);
router.get("/", controller.list);
router.get("/available", controller.getAvailable);
router.get("/export", controller.exportList);
router.get("/:id", controller.getById);
router.patch(
  "/:id",
  uploadCandidateFiles,
  handleMulterError,
  controller.updateById
);
router.patch("/:id/toggle-status", controller.toggleStatus);
router.patch("/:id/update-status", controller.updateStatus);
router.post("/bulk-import", controller.bulkImport);

module.exports = router;