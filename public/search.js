const SEARCH_ENGINE = "https://www.google.com/search?q=";

export function normalizeInput(value) {
  return String(value ?? "").trim();
}

export function isIpAddress(value) {
  return /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/|$)/.test(value);
}

export function isLikelyUrl(value) {
  if (!value || /\s/.test(value)) return false;
  return /^(https?:\/\/|localhost(?::\d+)?(?:\/|$)|\[::1\](?::\d+)?(?:\/|$)|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/|$)|[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/.*)?$)/i.test(value);
}

export function resolveAddress(value) {
  const input = normalizeInput(value);
  if (!input) return "";

  try {
    const url = new URL(input);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {}

  if (isLikelyUrl(input)) {
    const local = /^localhost(?::\d+)?(?:\/|$)|^127\.0\.0\.1(?::\d+)?(?:\/|$)|^\[::1\]/.test(input);
    return new URL((local ? "http://" : "https://") + input).href;
  }

  return SEARCH_ENGINE + encodeURIComponent(input);
}

export function getDisplayAddress(value) {
  try { return new URL(value).href; } catch { return value; }
}

export function isSearch(value) {
  const input = normalizeInput(value);
  return Boolean(input) && !isLikelyUrl(input) && !/^https?:\/\//i.test(input);
}

window.resolveAddress = resolveAddress;