export const normalizeListResponse = (res) => {
  const result = res?.data?.result || {}

  return {
    data: result.data ?? [],
    meta: result.meta ?? {},
    aggregates: result.aggregates ?? {},
    context: result.context ?? {}
  }
}
