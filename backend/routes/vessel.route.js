const express = require("express");
const controller = require("../controllers/vessel.controller");
const {
  uploadVesselFiles,
  handleMulterError,
} = require("../middleware/upload");
const router = express.Router();

router
  .post("/", uploadVesselFiles, handleMulterError, controller.create)
  .get("/", controller.list)
  .get("/:id", controller.getById)
  .patch(
    "/:id",
    uploadVesselFiles,
    handleMulterError,
    controller.updateById,
  )
  .patch('/:id/toggle-status', controller.toggleStatus)
  .post("/bulk-import", controller.bulkImport)
  .get("/export", controller.exportList);

module.exports = router;
