import { registerSW } from "./register-sw.js";
import { resolveAddress } from "./search.js";
import { setStatus, addHistory } from "./sur.js";
import { mountFrame, resizeFrame } from "./embed.js";

const form = document.querySelector("#proxy-form");
const address = document.querySelector("#address");
const browser = document.querySelector("#browser");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js"
  }
});

scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
let frame;
let transportReady = false;

async function ensureTransport() {
  if (transportReady) return;

  const websocket =
    (location.protocol === "https:" ? "wss:" : "ws:") +
    "//" +
    location.host +
    "/wisp/";

  await connection.setTransport("/libcurl/index.mjs", [{ websocket }]);
  transportReady = true;
}

async function navigate(value) {
  const target = resolveAddress(value);
  if (!target) return;

  setStatus("Starting browser…");

  await registerSW();
  await ensureTransport();

  if (!frame) {
    frame = scramjet.createFrame();
    mountFrame(browser, frame.frame);
    resizeFrame(frame.frame);
  }

  setStatus("Loading…");
  address.value = target;
  frame.go(target);
  addHistory(target);
  setStatus("");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await navigate(address.value);
  } catch (error) {
    console.error(error);
    setStatus(error?.message || String(error), "error");
  }
});

window.imagination = { navigate, scramjet, connection };