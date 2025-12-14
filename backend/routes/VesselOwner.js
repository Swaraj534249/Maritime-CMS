const express = require('express')
const vesselOwnerController = require("../controllers/VesselOwner")
const { uploadVesselOwnerFiles, handleMulterError } = require('../middleware/upload')
const router = express.Router()

router
    .post("/", uploadVesselOwnerFiles, handleMulterError, vesselOwnerController.create)
    .get("/", vesselOwnerController.getAll)
    .get("/:id", vesselOwnerController.getById)
    .patch("/:id", uploadVesselOwnerFiles, handleMulterError, vesselOwnerController.updateById)
    .patch("/undelete/:id", vesselOwnerController.undeleteById)
    .delete("/:id", vesselOwnerController.deleteById)
    // .delete("/:id/documents/:documentId", vesselOwnerController.deleteDocument)

module.exports = router