import { useEffect, useState } from "react";
import { axiosi } from "../config/axios";
import { getFileURL, isS3Key } from "../utils/fileUtils";

/** In-memory cache: S3 path → blob URL (same-origin stream, works with auth cookies). */
const streamCache = new Map();
const inflight = new Map();

async function fetchStreamBlob(path) {
  if (streamCache.has(path)) return streamCache.get(path);
  if (inflight.has(path)) return inflight.get(path);

  const promise = axiosi
    .get("/files/stream", { params: { path }, responseType: "blob" })
    .then((res) => {
      const blobUrl = URL.createObjectURL(res.data);
      streamCache.set(path, blobUrl);
      inflight.delete(path);
      return blobUrl;
    })
    .catch((err) => {
      inflight.delete(path);
      throw err;
    });

  inflight.set(path, promise);
  return promise;
}

/** Clear cached blob when profile image is replaced. */
export function invalidateFileDisplayCache(path) {
  if (!path) return;
  const normalized = String(path).replace(/\\/g, "/");
  const cached = streamCache.get(normalized);
  if (cached) {
    URL.revokeObjectURL(cached);
    streamCache.delete(normalized);
  }
}

/**
 * Display URL for avatars/images via authenticated /files/stream (not presigned S3 URLs,
 * which often break in <img> due to bucket CORS).
 */
export function useFileDisplayUrl(file) {
  const pathKey = file?.path ? String(file.path).replace(/\\/g, "/") : null;

  const [url, setUrl] = useState(() => {
    if (!pathKey) return null;
    if (!isS3Key(pathKey)) return getFileURL(file.path, file);
    return null;
  });

  useEffect(() => {
    if (!pathKey) {
      setUrl(null);
      return undefined;
    }

    if (!isS3Key(pathKey)) {
      setUrl(getFileURL(file.path, file));
      return undefined;
    }

    let cancelled = false;

    fetchStreamBlob(pathKey)
      .then((blobUrl) => {
        if (!cancelled) setUrl(blobUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pathKey, file?.path]);

  return url;
}
