import { getFileURL } from "../utils/fileUtils";

export const useDocumentActions = () => {
  const openDocument = (fileMeta) => {
    if (!fileMeta?.path && !fileMeta?.url) return;

    const fileURL = getFileURL(fileMeta.path, fileMeta);
    if (!fileURL) return;

    window.open(fileURL, "_blank", "noopener,noreferrer");
  };

  return { openDocument };
};
