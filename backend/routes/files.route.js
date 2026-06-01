const express = require("express");
const router = express.Router();
const filesController = require("../controllers/files.controller");
const { verifyToken } = require("../middleware/VerifyToken");
const { uploadSingleFile, handleMulterError } = require("../middleware/upload");

router.use(verifyToken);
router.post(
  "/upload",
  uploadSingleFile,
  handleMulterError,
  filesController.upload,
);
router.post("/presign-upload", filesController.presignUpload);
router.get("/access", filesController.access);
router.get("/stream", filesController.stream);
router.get("/presign", filesController.presign);

module.exports = router;
