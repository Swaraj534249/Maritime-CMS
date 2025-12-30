const express = require('express')
const vesselController = require("../controllers/Vessel")
const { uploadVesselFiles, handleMulterError } = require('../middleware/upload')
const router = express.Router()

router
  .post("/", uploadVesselFiles, handleMulterError, vesselController.create)
  .get("/", vesselController.getAllLimit)
  .get("/all", vesselController.getAll)
  .get("/:id", vesselController.getById)
  .patch("/:id", uploadVesselFiles, handleMulterError, vesselController.updateById)
  .patch("/undelete/:id", vesselController.undeleteById)
  .delete("/:id", vesselController.deleteById)

module.exports = router