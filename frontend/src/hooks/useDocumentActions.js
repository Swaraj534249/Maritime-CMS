import { getFileURL } from "../utils/fileUtils";

export const useDocumentActions = () => {
  const isPDF = (file) =>
    file?.mimetype === "application/pdf" ||
    file?.filename?.toLowerCase().endsWith(".pdf") ||
    file?.originalName?.toLowerCase().endsWith(".pdf");

  const openDocument = (fileMeta) => {
    if (!fileMeta?.path && !fileMeta?.url) return;

    const fileURL = getFileURL(fileMeta.path, fileMeta);
    if (!fileURL) return;

    window.open(fileURL, "_blank", "noopener,noreferrer");
  };

  return { openDocument };
};
