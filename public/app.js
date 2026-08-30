import { registerSW } from "./register-sw.js";
import { resolveAddress } from "./search.js";
import { suggestions, renderSuggestions } from "./psearch.js";
import { setStatus, addHistory, getHistory, clearHistory, formatError } from "./sur.js";
import { mountFrame, resizeFrame, focusFrame } from "./embed.js";

const form = document.querySelector("#proxy-form");
const address = document.querySelector("#address");
const browser = document.querySelector("#browser");
const suggestionBox = document.querySelector("#suggestions");
const backButton = document.querySelector("#back");
const forwardButton = document.querySelector("#forward");
const reloadButton = document.querySelector("#reload");
const homeButton = document.querySelector("#home");
const historyButton = document.querySelector("#history");
const historyPanel = document.querySelector("#history-panel");
const clearHistoryButton = document.querySelector("#clear-history");

let frame;
let frameElement;
let transportReady = false;
let startingPromise;
let navigationHistory = [];
let navigationIndex = -1;

function assertRuntime(name, value) {
  if (!value) throw new Error(name + " failed to load. Check the server routes and browser console.");
  return value;
}

const runtime = assertRuntime("Scramjet runtime", window.$scramjetLoadController);
const { ScramjetController } = runtime();
const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js"
  }
});

scramjet.init();

function websocketUrl() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return protocol + "//" + location.host + "/wisp/";
}

const BareMuxConnection = assertRuntime(
  "BareMux runtime",
  window.BareMux?.BareMuxConnection
);

const connection = new BareMuxConnection("/baremux/worker.js");

async function ensureTransport() {
  if (transportReady) return;

  setStatus("Connecting transport…");
  await connection.setTransport("/libcurl/index.mjs", [{
    websocket: websocketUrl()
  }]);
  transportReady = true;
}

async function startBrowser() {
  if (startingPromise) return startingPromise;

  startingPromise = (async () => {
    setStatus("Starting Scramjet…");
    await registerSW();
    await ensureTransport();

    if (!frame) {
      frame = scramjet.createFrame();
      frameElement = mountFrame(browser, frame.frame);
      resizeFrame(frameElement);
      window.addEventListener("resize", () => resizeFrame(frameElement));
    }

    setStatus("");
  })();

  try {
    return await startingPromise;
  } catch (error) {
    startingPromise = undefined;
    throw error;
  }
}

function pushNavigation(url) {
  navigationHistory = navigationHistory.slice(0, navigationIndex + 1);
  if (navigationHistory[navigationHistory.length - 1] !== url) navigationHistory.push(url);
  navigationIndex = navigationHistory.length - 1;
  updateNavigationButtons();
}

function updateNavigationButtons() {
  if (backButton) backButton.disabled = navigationIndex <= 0;
  if (forwardButton) forwardButton.disabled = navigationIndex >= navigationHistory.length - 1;
}

async function navigate(value, options = {}) {
  const target = resolveAddress(value);
  if (!target) return;

  await startBrowser();
  setStatus("Loading…");
  address.value = target;

  try {
    // Scramjet's frame API is the navigation boundary.
    frame.go(target);

    if (!options.fromHistory) {
      pushNavigation(target);
      addHistory(target);
    }

    focusFrame(frameElement);
    setStatus("");
  } catch (error) {
    setStatus(formatError(error), "error");
    throw error;
  }
}

async function goBack() {
  if (navigationIndex <= 0) return;
  navigationIndex -= 1;
  updateNavigationButtons();
  await navigate(navigationHistory[navigationIndex], { fromHistory: true });
}

async function goForward() {
  if (navigationIndex >= navigationHistory.length - 1) return;
  navigationIndex += 1;
  updateNavigationButtons();
  await navigate(navigationHistory[navigationIndex], { fromHistory: true });
}

async function reload() {
  const current = navigationHistory[navigationIndex];
  if (current) await navigate(current, { fromHistory: true });
}

function goHome() {
  address.value = "";
  suggestionBox.hidden = true;
  address.focus();
}

function renderHistory() {
  if (!historyPanel) return;
  const header = document.createElement("div");
  header.className = "history-header";
  header.innerHTML = "<strong>History</strong><button type=\"button\" id=\"clear-history-dynamic\">Clear</button>";

  historyPanel.replaceChildren(header);

  header.querySelector("button").addEventListener("click", () => {
    clearHistory();
    renderHistory();
  });

  const entries = getHistory();
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "No browsing history yet.";
    historyPanel.append(empty);
    return;
  }

  for (const entry of entries.slice(0, 30)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.textContent = entry.title || entry.url;
    button.addEventListener("click", () => {
      historyPanel.hidden = true;
      navigate(entry.url).catch((error) => setStatus(formatError(error), "error"));
    });
    historyPanel.append(button);
  }
}

function toggleHistory() {
  if (!historyPanel) return;
  historyPanel.hidden = !historyPanel.hidden;
  if (!historyPanel.hidden) renderHistory();
}

function updateSuggestions() {
  const items = suggestions(address.value, getHistory());
  renderSuggestions(suggestionBox, items, (item) => {
    suggestionBox.hidden = true;
    navigate(item.url).catch((error) => setStatus(formatError(error), "error"));
  });
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  suggestionBox.hidden = true;
  navigate(address.value).catch((error) => {
    console.error(error);
    setStatus(formatError(error), "error");
  });
});

address?.addEventListener("input", updateSuggestions);
address?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") suggestionBox.hidden = true;
});

backButton?.addEventListener("click", () => goBack().catch((e) => setStatus(formatError(e), "error")));
forwardButton?.addEventListener("click", () => goForward().catch((e) => setStatus(formatError(e), "error")));
reloadButton?.addEventListener("click", () => reload().catch((e) => setStatus(formatError(e), "error")));
homeButton?.addEventListener("click", goHome);
historyButton?.addEventListener("click", toggleHistory);
clearHistoryButton?.addEventListener("click", () => { clearHistory(); renderHistory(); });

window.addEventListener("imagination:history", () => {
  if (historyPanel && !historyPanel.hidden) renderHistory();
});

document.querySelectorAll("[data-url]").forEach((button) => {
  button.addEventListener("click", () => navigate(button.dataset.url));
});

window.imagination = {
  navigate,
  goBack,
  goForward,
  reload,
  startBrowser,
  scramjet,
  connection,
  get transportReady() { return transportReady; }
};

updateNavigationButtons();
setStatus("Ready");