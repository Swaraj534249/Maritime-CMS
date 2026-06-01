const express = require("express");
const controller = require("../controllers/vessel.controller");
const { parseFormFields } = require("../middleware/upload");
const { applyPresignedUploads } = require("../middleware/applyPresignedUploads");
const { verifyToken } = require("../middleware/VerifyToken");
const { authorize, checkAgencyStatus } = require("../middleware/authorization");

const router = express.Router();

router.use(verifyToken);
router.use(authorize("AGENT", "AGENCY_ADMIN", "SUPER_ADMIN"));
router.use((req, res, next) => {
  if (req.user.role === "SUPER_ADMIN") {
    return next();
  }
  return checkAgencyStatus(req, res, next);
});

router
  .post("/", parseFormFields, controller.create)
  .get("/", controller.list)
  .get("/:id", controller.getById)
  .patch("/:id", parseFormFields, applyPresignedUploads, controller.updateById)
  .patch("/:id/toggle-status", controller.toggleStatus)
  .post("/bulk-import", controller.bulkImport)
  .get("/export", controller.exportList);

module.exports = router;
