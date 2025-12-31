const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { UPLOAD_RULES } = require("./uploadRules");

const createDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

const coerceToString = (value) => {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return String(value[0] ?? "");
  if (typeof value === "string") return value;
  try {
    return String(value);
  } catch (e) {
    return "";
  }
};

const sanitizeFolderName = (name) => {
  const s = coerceToString(name).trim();
  if (!s) return "unknown";
  return s.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
};

// Dynamic storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const rawFolder = coerceToString(req.body.uploadFolder) || "default";
    const folderName = sanitizeFolderName(rawFolder);

    const rules =
      UPLOAD_RULES[folderName] ||
      UPLOAD_RULES[
        Object.keys(UPLOAD_RULES).find(
          (key) => key.toLowerCase() === folderName,
        )
      ] ||
      [];

    let rawSubFolderValue = "unknown";

    for (const field of rules) {
      const value = coerceToString(req.body[field]);
      console.log("value: ", value);

      if (value) {
        rawSubFolderValue = value;
        break;
      }
    }

    const subFolderName = sanitizeFolderName(rawSubFolderValue);

    const uploadDir = path.join(
      __dirname,
      "..",
      "uploads",
      folderName,
      subFolderName,
    );

    createDirectory(uploadDir);

    req._uploadInfo = { folderName, subFolderName, uploadDir };

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}-${sanitizedName}${ext}`);
  },
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = {
    "image/png": true,
    "image/jpeg": true,
    "image/jpg": true,
    "application/pdf": true,
    "application/msword": true,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
    "application/vnd.ms-excel": true,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
  };

  if (allowedMimes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only PDF, Word, Excel, PNG, JPG, JPEG allowed`,
      ),
      false,
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Maximum size is 10MB per file",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Too many files or unexpected field name",
      });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err) {
    return res.status(400).json({ message: err.message });
  }

  next();
};

module.exports = {
  uploadVesselOwnerFiles: upload.fields([
    { name: "company_logo", maxCount: 1 },
    { name: "contract", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),

  uploadVesselFiles: upload.fields([
    { name: "vessel_image", maxCount: 1 },
    { name: "vessel_documents", maxCount: 10 },
  ]),

  uploadSingle: (fieldName = "file") => upload.single(fieldName),
  uploadMultiple: (fieldName = "files", maxCount = 10) =>
    upload.array(fieldName, maxCount),
  uploadFields: (fields) => upload.fields(fields),
  handleMulterError,

  deleteFile: (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting file: ${filePath}`, error);
      return false;
    }
  },
};
