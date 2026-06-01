const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getS3Client } = require("../clients");

function buildObjectKey(tenantKey, folderName, subFolderName, filename) {
  return [tenantKey, folderName, subFolderName, filename]
    .map((p) => String(p || "").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

async function uploadFile({ key, body, contentType }) {
  const bucket = process.env.S3_BUCKET_NAME;
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key, bucket };
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
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    }),
  );
  return true;
}

async function getPresignedUploadUrl(
  key,
  contentType,
  expiresInSeconds = 900,
) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType || "application/octet-stream",
  });
  const ttl =
    Number(process.env.S3_PRESIGN_UPLOAD_EXPIRES_SECONDS) ||
    expiresInSeconds;
  return getSignedUrl(getS3Client(), command, { expiresIn: ttl });
}

async function getPresignedDownloadUrl(key, expiresInSeconds = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });
  const ttl =
    Number(process.env.S3_PRESIGN_EXPIRES_SECONDS) || expiresInSeconds;
  return getSignedUrl(getS3Client(), command, { expiresIn: ttl });
}

module.exports = {
  buildObjectKey,
  uploadFile,
  uploadBuffer,
  deleteObject,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
};
