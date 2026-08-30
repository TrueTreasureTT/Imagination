const SEARCH_ENGINE = "https://www.google.com/search?q=";

export function normalizeInput(value) {
  return String(value ?? "").trim();
}

export function isLikelyUrl(value) {
  if (!value || /\s/.test(value)) return false;
  return /^(https?:\/\/|localhost(?::\d+)?(?:\/|$)|\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:\/|$)|[^/]+\.[^/]+(?:\/.*)?$)/i.test(value);
}

export function resolveAddress(value) {
  const input = normalizeInput(value);
  if (!input) return "";

  try {
    const url = new URL(input);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {}

  if (isLikelyUrl(input)) {
    try {
      return new URL("https://" + input).href;
    } catch {}
  }

  return SEARCH_ENGINE + encodeURIComponent(input);
}

export function getDisplayAddress(value) {
  try {
    const url = new URL(value);
    return url.href;
  } catch {
    return value;
  }
}

export function isSearch(value) {
  return !isLikelyUrl(normalizeInput(value));
}

window.resolveAddress = resolveAddress;