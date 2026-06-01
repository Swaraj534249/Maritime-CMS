import { axiosi } from "../config/axios";

const LOGO_FIELDS = new Set(["company_logo"]);
const LOGO_MAX_WIDTH = 256;

/**
 * Resize logo in browser before upload.
 */
export async function resizeLogoFile(file, maxWidth = LOGO_MAX_WIDTH) {
  if (!file?.type?.startsWith("image/")) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("Failed to resize image"));
            return;
          }
          const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for resize"));
    };
    img.src = objectUrl;
  });
}

/**
 * Upload file through API → S3 (same origin; no S3 bucket CORS required).
 */
export async function uploadFileViaPresigned(file, {
  uploadFolder,
  formFields = {},
  fieldname,
}) {
  if (!file) return null;

  let body = file;
  if (LOGO_FIELDS.has(fieldname)) {
    body = await resizeLogoFile(file);
  }

  const formData = new FormData();
  formData.append("file", body);
  formData.append("uploadFolder", uploadFolder);
  formData.append("fieldname", fieldname);
  Object.entries(formFields).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      formData.append(key, val);
    }
  });

  const { data } = await axiosi.post("/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return {
    key: data.key,
    filename: data.filename,
    originalName: data.originalName || file.name,
    mimetype: data.contentType,
    contentType: data.contentType,
    size: data.size ?? body.size,
    storage: "s3",
  };
}

function extractUploadErrorMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Upload failed"
  );
}

/**
 * Upload form files one-by-one. Successful uploads are kept even if others fail.
 * @returns {{ uploads: Record<string, object>, failures: { fieldname, fileName, message }[] }}
 */
export async function uploadFormFilesViaPresigned(uploadedFiles, {
  uploadFolder,
  formFields,
}) {
  const uploads = {};
  const failures = [];

  for (const [fieldname, file] of Object.entries(uploadedFiles || {})) {
    if (!file) continue;
    try {
      uploads[fieldname] = await uploadFileViaPresigned(file, {
        uploadFolder,
        formFields,
        fieldname,
      });
    } catch (err) {
      failures.push({
        fieldname,
        fileName: file.name,
        message: extractUploadErrorMessage(err),
      });
    }
  }

  return { uploads, failures };
}
