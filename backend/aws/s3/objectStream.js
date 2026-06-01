const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getS3Client } = require("../clients");

async function getS3ObjectStream(key) {
  return getS3Client().send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    }),
  );
}

module.exports = { getS3ObjectStream };
