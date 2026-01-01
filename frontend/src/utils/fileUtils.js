import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

export const getFileURL = (filePath) => {
  if (!filePath) return null;
  const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  return `${baseURL}/${filePath.replace(/\\/g, "/")}`;
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
