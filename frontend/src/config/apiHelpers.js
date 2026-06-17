/** Shared axios error handling for feature API modules. */

export function isRequestCanceled(error) {
  return error?.name === "CanceledError" || error?.code === "ERR_CANCELED";
}

export function rethrowApiError(error) {
  if (isRequestCanceled(error)) throw error;
  throw error?.response?.data ?? error;
}

export function multipartHeaders(data) {
  return data instanceof FormData
    ? { "Content-Type": "multipart/form-data" }
    : undefined;
}

export function entityIdFromPayload(data) {
  return data instanceof FormData ? data.get("_id") : data._id;
}
