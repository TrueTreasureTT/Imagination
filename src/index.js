import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { config } from "./config.js";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));
const startedAt = Date.now();

logging.set_level(logging.NONE);
wisp.options.allow_private_ips = config.security.allowPrivateIps;
wisp.options.allow_loopback_ips = config.security.allowLoopbackIps;

const app = Fastify({
  logger: { level: config.security.logLevel },
  trustProxy: config.server.trustProxy,
  serverFactory(handler) {
    const server = createServer((req, res) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      handler(req, res);
    });

    server.on("upgrade", (req, socket, head) => {
      if (req.url?.startsWith(config.runtime.wispPath)) {
        wisp.routeRequest(req, socket, head);
        return;
      }
      socket.destroy();
    });

    return server;
  }
});

app.addHook("onRequest", async (request, reply) => {
  reply.header("X-Request-Id", request.id);
});

await app.register(fastifyStatic, {
  root: publicPath,
  decorateReply: true,
  index: ["index.html"],
  maxAge: "1h"
});

await app.register(fastifyStatic, {
  root: scramjetPath,
  prefix: config.runtime.scramjetPrefix,
  decorateReply: false,
  maxAge: "1h",
  immutable: false
});

await app.register(fastifyStatic, {
  root: libcurlPath,
  prefix: config.runtime.libcurlPrefix,
  decorateReply: false,
  maxAge: "1h",
  immutable: false
});

await app.register(fastifyStatic, {
  root: baremuxPath,
  prefix: config.runtime.baremuxPrefix,
  decorateReply: false,
  maxAge: "1h",
  immutable: false
});

app.get("/health", { config: { rateLimit: false } }, async () => ({
  ok: true,
  status: "healthy",
  service: "imagination",
  engine: "scramjet",
  transport: "libcurl+wisp",
  uptime: Math.round((Date.now() - startedAt) / 1000)
}));

app.get("/ready", async () => ({
  ok: true,
  status: "ready",
  runtime: config.runtime
}));

app.get("/runtime", async () => ({
  scramjet: config.runtime.scramjetPrefix,
  baremux: config.runtime.baremuxPrefix,
  libcurl: config.runtime.libcurlPrefix,
  wisp: config.runtime.wispPath
}));

app.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith(config.runtime.wispPath)) {
    return reply.code(426).send({
      error: "Upgrade Required",
      message: "This endpoint expects a WebSocket upgrade."
    });
  }

  return reply.type("text/html").sendFile("index.html");
});

async function shutdown(signal) {
  app.log.info({ signal }, "Shutting down proxy engine");
  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error(error, "Shutdown failed");
    process.exit(1);
  }
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

try {
  await app.listen({ port: config.server.port, host: config.server.host });
  app.log.info({
    port: config.server.port,
    host: config.server.host,
    engine: "scramjet",
    transport: "libcurl+wisp"
  }, "Imagination proxy engine ready");
} catch (error) {
  app.log.error(error, "Proxy engine failed to start");
  process.exit(1);
}
