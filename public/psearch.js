import { resolveAddress, isLikelyUrl } from "./search.js";

const MAX_SUGGESTIONS = 6;

export function suggestions(query, history = []) {
  const q = String(query || "").trim();
  if (!q) return [];

  const items = [];

  if (isLikelyUrl(q)) {
    items.push({
      label: "Open " + resolveAddress(q),
      url: resolveAddress(q),
      type: "url"
    });
  } else {
    items.push({
      label: 'Search the web for "' + q + '"',
      url: resolveAddress(q),
      type: "search"
    });
  }

  for (const entry of history) {
    if (
      entry?.url &&
      entry.url.toLowerCase().includes(q.toLowerCase()) &&
      !items.some((item) => item.url === entry.url)
    ) {
      items.push({
        label: entry.title || entry.url,
        url: entry.url,
        type: "history"
      });
    }

    if (items.length >= MAX_SUGGESTIONS) break;
  }

  return items.slice(0, MAX_SUGGESTIONS);
}

export function renderSuggestions(container, items, onSelect) {
  if (!container) return;

  container.replaceChildren();

  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion";
    button.textContent = item.label;
    button.dataset.type = item.type;

    button.addEventListener("click", () => onSelect?.(item));
    container.append(button);
  }

  container.hidden = items.length === 0;
}

window.proxySuggestions = suggestions;