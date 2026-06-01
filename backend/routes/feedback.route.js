const express = require("express");
const router = express.Router();
const controller = require("../controllers/feedback.controller");
const { verifyToken } = require("../middleware/VerifyToken");
const { authorize, checkAgencyStatus } = require("../middleware/authorization");
const multer = require("multer");

const feedbackUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const maybeCheckAgency = (req, res, next) => {
  if (req.user.role === "SUPER_ADMIN") return next();
  return checkAgencyStatus(req, res, next);
};

router.use(verifyToken);

router.post(
  "/",
  authorize("AGENCY_ADMIN", "AGENT"),
  maybeCheckAgency,
  feedbackUpload.array("attachments", 5),
  controller.submit,
);

router.get(
  "/",
  authorize("SUPER_ADMIN", "AGENCY_ADMIN", "AGENT"),
  maybeCheckAgency,
  controller.list,
);

router.get(
  "/:id",
  authorize("SUPER_ADMIN", "AGENCY_ADMIN", "AGENT"),
  maybeCheckAgency,
  controller.getById,
);

router.patch(
  "/:id",
  authorize("SUPER_ADMIN", "AGENCY_ADMIN", "AGENT"),
  maybeCheckAgency,
  feedbackUpload.array("attachments", 5),
  controller.updateById,
);

module.exports = router;
