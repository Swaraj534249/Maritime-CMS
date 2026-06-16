import { useCallback, useEffect, useState } from "react";
import { axiosi } from "../config/axios";

/**
 * Reusable status-count fetcher for list pages.
 * Calls `GET /{resource}/status-counts` and returns { total, byStatus }.
 *
 * Counts are refetched whenever `params` change (typically just searchValue),
 * NOT on pagination/sort/status, so the dropdown counts stay stable.
 *
 * @param {string} resource - API resource segment (e.g. "candidates", "vacancies")
 * @param {object} [options]
 * @param {object} [options.params] - extra query params (e.g. { searchValue, vacancyId })
 * @param {boolean} [options.enabled=true]
 * @returns {{ total: number, byStatus: Record<string, number>, refetch: () => void }}
 */
export function useStatusCounts(resource, { params = {}, enabled = true } = {}) {
  const [counts, setCounts] = useState({ total: 0, byStatus: {} });

  // Stable dependency for the params object.
  const paramsKey = JSON.stringify(params);

  const fetchCounts = useCallback(
    async (signal) => {
      if (!enabled || !resource) return;
      try {
        const res = await axiosi.get(`/${resource}/status-counts`, {
          params,
          signal,
        });
        setCounts(res.data || { total: 0, byStatus: {} });
      } catch (err) {
        // Non-blocking: leave previous counts on failure/cancel.
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resource, enabled, paramsKey],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchCounts(controller.signal);
    return () => controller.abort();
  }, [fetchCounts]);

  return { ...counts, refetch: () => fetchCounts() };
}
