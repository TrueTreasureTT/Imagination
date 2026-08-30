import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const configPath = fileURLToPath(
  new URL("../config/proxy.config.json", import.meta.url)
);

function readJsonConfig() {
  if (!existsSync(configPath)) return {};

  try {
    return JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Invalid config/proxy.config.json: ${error.message}`);
  }
}

const fileConfig = readJsonConfig();

function envBoolean(name, fallback) {
  const value = process.env[name];
  if (value == null) return fallback;
  return /^(1|true|yes|on)$/i.test(value);
}

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = Object.freeze({
  server: {
    host: process.env.HOST || fileConfig.server?.host || "0.0.0.0",
    port: envNumber("PORT", fileConfig.server?.port || 8080),
    trustProxy: envBoolean(
      "TRUST_PROXY",
      fileConfig.server?.trustProxy ?? true
    )
  },
  runtime: {
    scramjetPrefix:
      fileConfig.runtime?.scramjetPrefix || "/scram/",
    baremuxPrefix:
      fileConfig.runtime?.baremuxPrefix || "/baremux/",
    libcurlPrefix:
      fileConfig.runtime?.libcurlPrefix || "/libcurl/",
    wispPath:
      fileConfig.runtime?.wispPath || "/wisp/"
  },
  security: {
    allowPrivateIps: envBoolean(
      "ALLOW_PRIVATE_IPS",
      fileConfig.security?.allowPrivateIps ?? false
    ),
    allowLoopbackIps: envBoolean(
      "ALLOW_LOOPBACK_IPS",
      fileConfig.security?.allowLoopbackIps ?? false
    ),
    logLevel:
      process.env.LOG_LEVEL ||
      fileConfig.security?.logLevel ||
      "warn"
  }
});
