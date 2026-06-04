import { uploadFormFilesViaPresigned } from "./s3PresignedUpload";
import { findOversizedFiles } from "./fileUtils";

function hasFilesToUpload(uploadedFiles) {
  return Object.values(uploadedFiles || {}).some(Boolean);
}

class EntitySubmitError extends Error {
  constructor(message, { partialUpload = false, savedFileCount = 0, uploadFailures = [] } = {}) {
    super(message);
    this.name = "EntitySubmitError";
    this.partialUpload = partialUpload;
    this.savedFileCount = savedFileCount;
    this.uploadFailures = uploadFailures;
  }
}

/**
 * 1) Save entity (create or update) without files — backend validates tenant uniqueness.
 * 2) Upload files to S3 under the tenant-scoped folder key.
 * 3) PATCH entity with s3_uploads metadata.
 */
export async function submitEntityWithFiles({
  formData,
  uploadedFiles,
  uploadFolder,
  uploadFormFields,
  isEditMode,
  entityId,
  buildFormData,
  create,
  update,
}) {
  const oversized = findOversizedFiles(uploadedFiles);
  if (oversized.length) {
    throw new EntitySubmitError(
      oversized.map((f) => f.message).join(" "),
      { partialUpload: false, uploadFailures: oversized },
    );
  }

  const data = buildFormData(formData);

  let id = entityId;

  if (isEditMode) {
    if (!id) {
      throw new Error("Cannot update: record id is missing");
    }
    data.append("_id", id);
    await update(data);
  } else {
    const created = await create(data);
    id = created?._id || created?.id;
    if (!id) {
      throw new Error("Create succeeded but no entity id was returned");
    }
  }

  if (!hasFilesToUpload(uploadedFiles)) {
    return { id, savedFileCount: 0, uploadFailures: [] };
  }

  const { uploads, failures } = await uploadFormFilesViaPresigned(uploadedFiles, {
    uploadFolder,
    formFields: uploadFormFields,
  });

  if (Object.keys(uploads).length) {
    const patchData = new FormData();
    patchData.append("_id", id);
    patchData.append("uploadFolder", uploadFolder);
    Object.entries(uploadFormFields || {}).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        patchData.append(key, val);
      }
    });
    patchData.append("s3_uploads", JSON.stringify(uploads));
    await update(patchData);
  }

  if (failures.length) {
    const savedFileCount = Object.keys(uploads).length;
    throw new EntitySubmitError(
      failures.map((f) => `${f.fileName}: ${f.message}`).join("; "),
      {
        partialUpload: savedFileCount > 0,
        savedFileCount,
        uploadFailures: failures,
      },
    );
  }

  return {
    id,
    savedFileCount: Object.keys(uploads).length,
    uploadFailures: [],
  };
}

export { EntitySubmitError };
