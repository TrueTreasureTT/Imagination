let registrationPromise;

export async function registerSW() {
  if (registrationPromise) return registrationPromise;

  registrationPromise = (async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("This browser does not support Service Workers.");
    }

    const secure =
      location.protocol === "https:" ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";

    if (!secure) {
      throw new Error(
        "Service Workers require HTTPS outside localhost."
      );
    }

    const registration = await navigator.serviceWorker.register(
      "/sw.js",
      {
        scope: "/",
        updateViaCache: "none"
      }
    );

    await navigator.serviceWorker.ready;

    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          resolve,
          { once: true }
        );

        setTimeout(resolve, 1500);
      });
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