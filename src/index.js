import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));
const port = Number(process.env.PORT || 8080);

logging.set_level(logging.NONE);

const app = Fastify({
  logger: true,
  serverFactory(handler) {
    const server = createServer((req, res) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      handler(req, res);
    });

    server.on("upgrade", (req, socket, head) => {
      if (req.url?.startsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
        return;
      }

      socket.destroy();
    });

    return server;
  }
});

await app.register(fastifyStatic, {
  root: publicPath,
  decorateReply: true,
  index: ["index.html"],
  maxAge: "1h"
});

await app.register(fastifyStatic, {
  root: scramjetPath,
  prefix: "/scram/",
  decorateReply: false,
  maxAge: "1h"
});

await app.register(fastifyStatic, {
  root: libcurlPath,
  prefix: "/libcurl/",
  decorateReply: false,
  maxAge: "1h"
});

await app.register(fastifyStatic, {
  root: baremuxPath,
  prefix: "/baremux/",
  decorateReply: false,
  maxAge: "1h"
});

app.get("/health", async () => ({
  ok: true,
  service: "imagination",
  engine: "scramjet",
  transport: "libcurl+wisp",
  uptime: process.uptime()
}));

app.get("/runtime", async () => ({
  scramjet: "/scram/",
  baremux: "/baremux/",
  libcurl: "/libcurl/",
  wisp: "/wisp/"
}));

app.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith("/wisp/")) {
    return reply.code(426).send({
      error: "This endpoint expects a WebSocket upgrade."
    });
  }

  return reply.sendFile("index.html");
});

app.addHook("onClose", async () => {
  app.log.info("Imagination shutting down");
});

try {
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info({ port }, "Imagination proxy stack ready");
} catch (error) {
  app.log.error(error);
  process.exit(1);
}