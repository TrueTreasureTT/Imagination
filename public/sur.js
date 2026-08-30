const STORAGE_KEY = "imagination.history.v2";
const MAX_HISTORY = 100;

export function setStatus(message = "", kind = "info") {
  const el = document.querySelector("#status");
  if (!el) return;

  el.textContent = message;
  el.dataset.kind = kind;
  el.hidden = !message;
}

export function getHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addHistory(url, title = url) {
  if (!url) return;

  const previous = getHistory().filter((entry) => entry.url !== url);
  previous.unshift({
    url,
    title: title || url,
    time: Date.now()
  });

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(previous.slice(0, MAX_HISTORY))
    );
  } catch {}

  window.dispatchEvent(new CustomEvent("imagination:history"));
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}

  window.dispatchEvent(new CustomEvent("imagination:history"));
}

export function formatError(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  return error.message || String(error);
}

window.proxyUI = {
  setStatus,
  addHistory,
  getHistory,
  clearHistory
};