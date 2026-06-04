const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getS3Client } = require("../clients");

function getBucketName() {
  return process.env.S3_BUCKET_NAME;
}

function getPresignUploadTtl(fallbackSeconds = 900) {
  return Number(process.env.S3_PRESIGN_UPLOAD_EXPIRES_SECONDS) || fallbackSeconds;
}

function getPresignDownloadTtl(fallbackSeconds = 3600) {
  return Number(process.env.S3_PRESIGN_EXPIRES_SECONDS) || fallbackSeconds;
}

function buildObjectKey(tenantKey, folderName, subFolderName, filename) {
  return [tenantKey, folderName, subFolderName, filename]
    .map((p) => String(p || "").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

async function uploadFile({ key, body, contentType }) {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key, bucket: getBucketName() };
}

async function uploadBuffer(buffer, key, contentType) {
  return uploadFile({
    key,
    body: buffer,
    contentType: contentType || "application/octet-stream",
  });
}

async function deleteObject(key) {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }),
  );
  return true;
}

async function getPresignedUploadUrl(key, contentType, expiresInSeconds) {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });
  return getSignedUrl(getS3Client(), command, {
    expiresIn: getPresignUploadTtl(expiresInSeconds),
  });
}

async function getPresignedDownloadUrl(key, expiresInSeconds) {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });
  return getSignedUrl(getS3Client(), command, {
    expiresIn: getPresignDownloadTtl(expiresInSeconds),
  });
}

module.exports = {
  getBucketName,
  getPresignUploadTtl,
  getPresignDownloadTtl,
  buildObjectKey,
  uploadFile,
  uploadBuffer,
  deleteObject,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
};
