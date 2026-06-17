/**
 * img with native lazy loading — use for all remote/static images in tables and UI.
 */
export default function LazyImage({ loading = "lazy", decoding = "async", alt = "", ...props }) {
  return <img loading={loading} decoding={decoding} alt={alt} {...props} />;
}
