/**
 * AWS env helpers (reads process.env after dotenv in index.js).
 */
function getAwsEndpoint() {
  const url = process.env.AWS_ENDPOINT_URL?.trim();
  return url || undefined;
}

function getSesFromEmail() {
  return process.env.SES_FROM_EMAIL || process.env.EMAIL;
}

function isLocalAws() {
  return Boolean(getAwsEndpoint());
}

module.exports = { getAwsEndpoint, getSesFromEmail, isLocalAws };
