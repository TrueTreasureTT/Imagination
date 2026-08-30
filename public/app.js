import { registerSW } from "./register-sw.js";
import { resolveAddress } from "./search.js";
import { suggestions, renderSuggestions } from "./psearch.js";
import {
  setStatus,
  addHistory,
  getHistory,
  clearHistory,
  formatError
} from "./sur.js";
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

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js"
  }
});

scramjet.init();

const connection = new BareMux.BareMuxConnection(
  "/baremux/worker.js"
);

function websocketUrl() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return protocol + "//" + location.host + "/wisp/";
}

async function ensureTransport() {
  if (transportReady) return;

  setStatus("Connecting transport…");

  await connection.setTransport("/libcurl/index.mjs", [
    {
      websocket: websocketUrl()
    }
  ]);

  transportReady = true;
}

async function startBrowser() {
  if (startingPromise) return startingPromise;

  startingPromise = (async () => {
    setStatus("Starting browser…");

    await registerSW();
    await ensureTransport();

    if (!frame) {
      frame = scramjet.createFrame();
      frameElement = mountFrame(browser, frame.frame);
      resizeFrame(frameElement);

      window.addEventListener("resize", () => {
        resizeFrame(frameElement);
      });
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
  if (!url) return;

  navigationHistory = navigationHistory.slice(
    0,
    navigationIndex + 1
  );

  if (navigationHistory[navigationHistory.length - 1] !== url) {
    navigationHistory.push(url);
  }

  navigationIndex = navigationHistory.length - 1;
  updateNavigationButtons();
}

function updateNavigationButtons() {
  if (backButton) backButton.disabled = navigationIndex <= 0;
  if (forwardButton) {
    forwardButton.disabled =
      navigationIndex >= navigationHistory.length - 1;
  }
}

async function navigate(value, options = {}) {
  const target = resolveAddress(value);
  if (!target) return;

  await startBrowser();

  setStatus("Loading…");

  address.value = target;

  try {
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

  const target = navigationHistory[navigationIndex];
  await navigate(target, { fromHistory: true });
}

async function goForward() {
  if (navigationIndex >= navigationHistory.length - 1) return;

  navigationIndex += 1;
  updateNavigationButtons();

  const target = navigationHistory[navigationIndex];
  await navigate(target, { fromHistory: true });
}

function reload() {
  if (!frameElement) return;

  try {
    frameElement.contentWindow?.location?.reload();
  } catch {
    const current = navigationHistory[navigationIndex];
    if (current) navigate(current, { fromHistory: true });
  }
}

function goHome() {
  if (!address.value) {
    address.focus();
    return;
  }

  address.value = "";
  address.focus();
}

function renderHistory() {
  if (!historyPanel) return;

  historyPanel.replaceChildren();

  const entries = getHistory();

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.textContent = "No browsing history yet.";
    historyPanel.append(empty);
    return;
  }

  for (const entry of entries.slice(0, 20)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.textContent = entry.title || entry.url;

    button.addEventListener("click", async () => {
      historyPanel.hidden = true;
      await navigate(entry.url);
    });

    historyPanel.append(button);
  }
}

function toggleHistory() {
  if (!historyPanel) return;

  historyPanel.hidden = !historyPanel.hidden;

  if (!historyPanel.hidden) {
    renderHistory();
  }
}

function updateSuggestions() {
  const items = suggestions(address.value, getHistory());

  renderSuggestions(suggestionBox, items, async (item) => {
    suggestionBox.hidden = true;
    await navigate(item.url);
  });
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    suggestionBox.hidden = true;
    await navigate(address.value);
  } catch (error) {
    console.error(error);
  }
});

address?.addEventListener("input", updateSuggestions);

address?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    suggestionBox.hidden = true;
  }
});

backButton?.addEventListener("click", () => {
  goBack().catch((error) => setStatus(formatError(error), "error"));
});

forwardButton?.addEventListener("click", () => {
  goForward().catch((error) => setStatus(formatError(error), "error"));
});

reloadButton?.addEventListener("click", reload);
homeButton?.addEventListener("click", goHome);
historyButton?.addEventListener("click", toggleHistory);

clearHistoryButton?.addEventListener("click", () => {
  clearHistory();
  renderHistory();
});

window.addEventListener("imagination:history", () => {
  if (historyPanel && !historyPanel.hidden) renderHistory();
});

window.imagination = {
  navigate,
  goBack,
  goForward,
  reload,
  startBrowser,
  scramjet,
  connection,
  get transportReady() {
    return transportReady;
  }
};

updateNavigationButtons();
setStatus("Ready");