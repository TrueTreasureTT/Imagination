import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const publicPath = fileURLToPath(new URL("../public/", import.meta.url));
logging.set_level(logging.NONE);

const app = Fastify({
  logger: true,
  serverFactory(handler) {
    return createServer()
      .on("request", (req, res) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        handler(req, res);
      })
      .on("upgrade", (req, socket, head) => {
        if (req.url?.startsWith("/wisp/")) {
          wisp.routeRequest(req, socket, head);
        } else {
          socket.destroy();
        }
      });
  }
});

await app.register(fastifyStatic, {
  root: publicPath,
  decorateReply: true,
  index: ["index.html"]
});

await app.register(fastifyStatic, {
  root: scramjetPath,
  prefix: "/scram/",
  decorateReply: false
});

await app.register(fastifyStatic, {
  root: libcurlPath,
  prefix: "/libcurl/",
  decorateReply: false
});

await app.register(fastifyStatic, {
  root: baremuxPath,
  prefix: "/baremux/",
  decorateReply: false
});

app.get("/health", async () => ({
  ok: true,
  service: "imagination",
  engine: "scramjet"
}));

app.setNotFoundHandler((request, reply) => {
  if (request.raw.url?.startsWith("/wisp/")) {
    return reply.code(404).send({ error: "WebSocket endpoint" });
  }

  return reply.sendFile("index.html");
});

const port = Number(process.env.PORT || 8080);

await app.listen({
  port,
  host: "0.0.0.0"
});

app.log.info(`Imagination listening on port ${port}`);