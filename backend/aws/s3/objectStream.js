const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getS3Client } = require("../clients");
const { getBucketName } = require("./storage.service");

async function getS3ObjectStream(key) {
  return getS3Client().send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    }),
  );
}

module.exports = { getS3ObjectStream };
