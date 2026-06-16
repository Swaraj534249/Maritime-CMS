/**
 * Singleton AWS SDK clients (S3 + SES).
 * @see docs/FILES_AND_S3.md
 */
const { S3Client } = require("@aws-sdk/client-s3");
const { SESClient } = require("@aws-sdk/client-ses");
const { getAwsEndpoint } = require("./env");

function baseClientConfig() {
  const endpoint = getAwsEndpoint();
  const config = {
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
    },
  };
  if (endpoint) config.endpoint = endpoint;
  return { config, endpoint };
}

let s3Client;
let sesClient;

function getS3Client() {
  if (!s3Client) {
    const { config, endpoint } = baseClientConfig();
    s3Client = new S3Client({
      ...config,
      forcePathStyle: Boolean(endpoint),
      followRegionRedirects: !endpoint,
    });
  }
  return s3Client;
}

function getSesClient() {
  if (!sesClient) {
    const { config } = baseClientConfig();
    sesClient = new SESClient(config);
  }
  return sesClient;
}

module.exports = { getS3Client, getSesClient };
