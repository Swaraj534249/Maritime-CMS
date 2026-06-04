import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { getApiBaseUrl } from "../config/axios";

/** Must match backend `MAX_BYTES` (10 MB). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = "10MB";

export function formatFileSize(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isFileTooLarge(file, maxBytes = MAX_FILE_BYTES) {
  return Boolean(file?.size && file.size > maxBytes);
}

export function getFileSizeError(file, maxBytes = MAX_FILE_BYTES) {
  if (!file || !isFileTooLarge(file, maxBytes)) return null;
  return `${file.name} is too large (${formatFileSize(file.size)}). Maximum is ${MAX_FILE_SIZE_LABEL} per file.`;
}

/** Returns files that exceed the size limit. */
export function findOversizedFiles(filesMap = {}) {
  const invalid = [];
  for (const [fieldname, file] of Object.entries(filesMap)) {
    if (!file) continue;
    const message = getFileSizeError(file);
    if (message) invalid.push({ fieldname, fileName: file.name, message });
  }
  return invalid;
}

/** S3 object key stored in MongoDB path field. */
export const isS3Key = (filePath) => {
  if (!filePath) return false;
  const normalized = String(filePath).replace(/\\/g, "/");
  return !normalized.startsWith("/");
};

/**
 * URL for viewing/downloading a file (S3 keys via authenticated API routes).
 */
export const getFileURL = (filePath, file) => {
  if (file?.url) return file.url;
  if (!filePath || !isS3Key(filePath)) return null;

  const baseURL = getApiBaseUrl();
  const normalized = String(filePath).replace(/\\/g, "/");

  const isImage =
    file?.mimetype?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(normalized);
  const route = isImage ? "stream" : "access";
  return `${baseURL}/files/${route}?path=${encodeURIComponent(normalized)}`;
};

export const isPDF = (file) =>
  file?.mimetype === "application/pdf" ||
  file?.filename?.toLowerCase().endsWith(".pdf") ||
  file?.originalName?.toLowerCase().endsWith(".pdf");

export const getFileIcon = (document) => {
  if (!document) return <InsertDriveFileIcon />;

  const ext = document.filename?.split(".").pop()?.toLowerCase();

  if (document.mimetype === "application/pdf" || ext === "pdf") {
    return <PictureAsPdfIcon color="error" />;
  }

  if (["doc", "docx"].includes(ext)) {
    return <DescriptionIcon color="primary" />;
  }

  if (["xls", "xlsx"].includes(ext)) {
    return <DescriptionIcon color="success" />;
  }

  return <InsertDriveFileIcon />;
};
