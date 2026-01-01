const express = require("express");
const controller = require("../controllers/vesselOwner.controller");
const {
  uploadVesselOwnerFiles,
  handleMulterError,
} = require("../middleware/upload");
const router = express.Router();

router
  .post("/",uploadVesselOwnerFiles,handleMulterError,controller.create)
  .get("/", controller.list)
  .get("/:id", controller.getById)
  .patch("/:id",uploadVesselOwnerFiles,handleMulterError,controller.updateById)
  .patch('/:id/toggle-status', controller.toggleStatus)
  .post("/bulk-import", controller.bulkImport)
  .get("/export", controller.exportList);

module.exports = router;
