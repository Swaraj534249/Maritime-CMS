const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Helper function to create directory if it doesn't exist
const createDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`Created directory: ${dirPath}`)
  }
}

// Robust coercion + sanitize helper: if value is array take first, coerce to string
const coerceToString = (value) => {
  if (value === undefined || value === null) return ''
  if (Array.isArray(value)) return String(value[0] ?? '')
  if (typeof value === 'string') return value
  try {
    return String(value)
  } catch (e) {
    return ''
  }
}

const sanitizeFolderName = (name) => {
  const s = coerceToString(name).trim()
  if (!s) return 'unknown'
  return s.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
}

// Dynamic storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // read uploadFolder and company fields defensively (take first if array)
    const rawFolder = coerceToString(req.body.uploadFolder) || 'vesselOwners'
    const rawCompany = coerceToString(req.body.company_shortname) || coerceToString(req.body.company_name) || 'unknown'

    const folderName = sanitizeFolderName(rawFolder)
    const sanitizedCompanyName = sanitizeFolderName(rawCompany)

    // Create path: uploads/<folderName>/<companyName>/
    const uploadDir = path.join(__dirname, '..', 'uploads', folderName, sanitizedCompanyName)

    // Create directory if it doesn't exist
    createDirectory(uploadDir)

    // store info for later use (controller can compute web path if needed)
    req._uploadInfo = { folderName, sanitizedCompanyName, uploadDir }

    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Generate unique filename: fieldname-timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const nameWithoutExt = path.basename(file.originalname, ext)
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    cb(null, `${file.fieldname}-${uniqueSuffix}-${sanitizedName}${ext}`)
  }
})

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedMimes = {
    'image/png': true,
    'image/jpeg': true,
    'image/jpg': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true
  }

  if (allowedMimes[file.mimetype]) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF, Word, Excel, PNG, JPG, JPEG allowed`), false)
  }
}

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size per file
  }
})

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 10MB per file'
      })
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Too many files or unexpected field name'
      })
    }
    return res.status(400).json({ message: err.message })
  }

  if (err) {
    return res.status(400).json({ message: err.message })
  }

  next()
}

// Export middleware for different field configurations
module.exports = {
  // For vessel owner form with company_logo, contract and license fields
  uploadVesselOwnerFiles: upload.fields([
    { name: 'company_logo', maxCount: 1 },    // Image - single file
    { name: 'contract', maxCount: 1 },        // Contract document
    { name: 'license', maxCount: 1 },         // License document
    { name: 'documents', maxCount: 10 }       // additional multiple docs
 ]),

  // Generic single file upload
  uploadSingle: (fieldName = 'file') => upload.single(fieldName),

  // Generic multiple files upload
  uploadMultiple: (fieldName = 'files', maxCount = 10) => upload.array(fieldName, maxCount),

  // Generic fields upload (for any form)
  uploadFields: (fields) => upload.fields(fields),

  // Error handler
  handleMulterError,

  // Utility function to delete file
  deleteFile: (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`Deleted file: ${filePath}`)
        return true
      }
      return false
    } catch (error) {
      console.error(`Error deleting file: ${filePath}`, error)
      return false
    }
  }
}