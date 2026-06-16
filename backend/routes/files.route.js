const express = require("express");
const router = express.Router();
const filesController = require("../controllers/files.controller");
const {
  uploadSingleFile,
  handleMulterError,
} = require("../middleware/upload");
const { assertUploadUserScope } = require("../middleware/assertUploadUserScope");
const {
  assertCanAccessFilePathMiddleware,
} = require("../middleware/fileAccessAuth");

router.post(
  "/upload",
  assertUploadUserScope,
  uploadSingleFile,
  handleMulterError,
  filesController.upload,
);
router.post(
  "/presign-upload",
  assertUploadUserScope,
  filesController.presignUpload,
);
router.get("/access", assertCanAccessFilePathMiddleware, filesController.access);
router.get("/stream", assertCanAccessFilePathMiddleware, filesController.stream);
router.get("/presign", assertCanAccessFilePathMiddleware, filesController.presign);

module.exports = router;
