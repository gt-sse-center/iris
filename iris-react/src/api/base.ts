const RAW_BASE = (import.meta.env.VITE_BACKEND_URL ?? "").trim();
const DEFAULT_BASE =
  typeof window !== "undefined" && typeof window.location !== "undefined"
    ? window.location.origin
    : "http://127.0.0.1:5173";

export const API_BASE = (RAW_BASE || DEFAULT_BASE).replace(/\/$/, "");
export const HAS_CUSTOM_BACKEND = RAW_BASE.length > 0;

function normalisePath(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export function buildBackendUrl(path: string, options: { forceRelative?: boolean } = {}): string {
  const normalised = normalisePath(path);
  if (options.forceRelative || !HAS_CUSTOM_BACKEND) {
    return normalised;
  }
  return `${API_BASE}${normalised}`;
}

export function backendUrlCandidates(path: string): string[] {
  const urls = new Set<string>();
  if (HAS_CUSTOM_BACKEND) {
    urls.add(buildBackendUrl(path));
  }
  urls.add(buildBackendUrl(path, { forceRelative: true }));
  return Array.from(urls);
}
