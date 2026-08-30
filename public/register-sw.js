let registrationPromise;

function isSecureContextForSW() {
  return location.protocol === "https:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";
}

async function waitForController(timeout = 4000) {
  if (navigator.serviceWorker.controller) return;

  await new Promise((resolve) => {
    const timer = setTimeout(resolve, timeout);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

export async function registerSW() {
  if (registrationPromise) return registrationPromise;

  registrationPromise = (async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Workers are not supported by this browser.");
    }
    if (!isSecureContextForSW()) {
      throw new Error("Open this app over HTTPS or localhost so the proxy Service Worker can run.");
    }

    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none"
    });

    await navigator.serviceWorker.ready;
    await waitForController();

    if (!navigator.serviceWorker.controller) {
      // First install may require one reload before the SW controls this page.
      console.warn("Service Worker installed but is not controlling this page yet.");
    }

    return registration;
  })();

  try {
    return await registrationPromise;
  } catch (error) {
    registrationPromise = undefined;
    throw error;
  }
}

window.registerProxySW = registerSW;