const express = require("express");
const vesselOwnerController = require("../controllers/VesselOwner");
const {
  uploadVesselOwnerFiles,
  handleMulterError,
} = require("../middleware/upload");
const router = express.Router();

router
  .post(
    "/",
    uploadVesselOwnerFiles,
    handleMulterError,
    vesselOwnerController.create,
  )
  .get("/", vesselOwnerController.getAllLimit)
  .get("/all", vesselOwnerController.getAll)
  .get("/:id", vesselOwnerController.getById)
  .patch(
    "/:id",
    uploadVesselOwnerFiles,
    handleMulterError,
    vesselOwnerController.updateById,
  )
  .patch("/undelete/:id", vesselOwnerController.undeleteById)
  .delete("/:id", vesselOwnerController.deleteById);

module.exports = router;
