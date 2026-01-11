const express = require("express");
const router = express.Router();
const controller = require("../controllers/agency.controller");
const { verifyToken } = require("../middleware/VerifyToken");
const { authorize, checkAgencyAccess } = require("../middleware/authorization");

router.use(verifyToken);

router.post("/", authorize("SUPER_ADMIN"), controller.create);
router.get("/", authorize("SUPER_ADMIN"), controller.list);

router.get("/:id", checkAgencyAccess, controller.getById);

router.patch(
  "/:id",
  authorize("AGENCY_ADMIN", "SUPER_ADMIN"),
  checkAgencyAccess,
  controller.updateById
);

router.patch(
  "/:id/toggle-status",
  authorize("SUPER_ADMIN"),
  controller.toggleStatus
);

module.exports = router;
