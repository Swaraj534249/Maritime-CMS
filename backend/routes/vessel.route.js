const express = require("express");
const controller = require("../controllers/vessel.controller");
const { parseFormFields } = require("../middleware/upload");
const { mountStaffAccess } = require("../middleware/routeGuards");
const { presignedPatchChain } = require("../middleware/presignedPatch");

const router = express.Router();

mountStaffAccess(router);

router
  .post("/", parseFormFields, controller.create)
  .get("/", controller.list)
  .get("/:id", controller.getById)
  .patch("/:id", ...presignedPatchChain, controller.updateById)
  .patch("/:id/toggle-status", controller.toggleStatus)
  .post("/bulk-import", controller.bulkImport)
  .get("/export", controller.exportList);

module.exports = router;
