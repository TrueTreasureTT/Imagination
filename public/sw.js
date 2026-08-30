importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

let configPromise;

function ensureConfig() {
  if (!configPromise) {
    configPromise = scramjet.loadConfig().catch((error) => {
      configPromise = undefined;
      throw error;
    });
  }

  return configPromise;
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        await ensureConfig();

        if (scramjet.route(event)) {
          return await scramjet.fetch(event);
        }

        return await fetch(event.request);
      } catch (error) {
        return new Response(
          "Imagination Service Worker error: " +
            (error?.message || String(error)),
          {
            status: 502,
            headers: {
              "content-type": "text/plain; charset=utf-8"
            }
          }
        );
      }
    })()
  );
});