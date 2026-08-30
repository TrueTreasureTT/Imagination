# Imagination

Imagination is a Node.js web application built around:

- Fastify for the HTTP server
- Scramjet for browser-frame rewriting/runtime
- BareMux for transport management
- libcurl transport for outbound requests
- Wisp for the WebSocket transport endpoint
- Service Workers for routing supported requests

## Requirements

- Node.js 20 or newer
- npm 10+ recommended
- A deployment platform that supports long-running Node.js processes
- WebSocket upgrade support
- HTTPS in production

GitHub Pages alone cannot run this application because it is static hosting and cannot run the Node.js server or Wisp WebSocket endpoint.

## Install

Clone the repository and install dependencies:

```bash
npm install
```

Then start the server:

```bash
npm start
```

Development mode:

```bash
npm run dev
```

The default address is:

```text
http://localhost:8080
```

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm install` | Install all dependencies |
| `npm start` | Start the production server |
| `npm run dev` | Start with Node watch mode |
| `npm run check` | Check JavaScript syntax |
| `npm run health` | Query the local health endpoint |

## Architecture

```text
Browser
  │
  ├── public/index.html
  │      │
  │      ├── /baremux/index.js
  │      ├── /scram/scramjet.all.js
  │      └── public/app.js
  │
  ├── register-sw.js
  │      └── public/sw.js
  │             └── ScramjetServiceWorker
  │
  └── Scramjet frame
         │
         └── BareMux
                │
                └── libcurl transport
                       │
                       └── /wisp/ WebSocket endpoint

Node.js server
  └── src/index.js
       ├── serves /public
       ├── serves /scram
       ├── serves /baremux
       ├── serves /libcurl
       ├── exposes /health
       └── handles /wisp/ upgrades
```

## Important routes

| Route | Purpose |
| --- | --- |
| `/` | Main application |
| `/sw.js` | Service Worker |
| `/scram/` | Scramjet runtime files |
| `/baremux/` | BareMux runtime |
| `/libcurl/` | libcurl transport |
| `/wisp/` | WebSocket transport endpoint |
| `/health` | Server health JSON |

## Production notes

Use a platform that supports:

1. Node.js 20+
2. Persistent HTTP processes
3. WebSocket upgrades
4. HTTPS
5. The port provided through `PORT`

The server listens on:

```js
process.env.PORT || 8080
```

Do not hard-code a production port.

## Troubleshooting

### Blank browser frame

Check that these routes return JavaScript/assets:

- `/scram/scramjet.all.js`
- `/baremux/index.js`
- `/libcurl/index.mjs`

### Service Worker fails

Production deployments require HTTPS. Localhost is treated as a secure context by browsers.

### Transport cannot connect

Verify the host supports WebSockets and does not block requests to:

```text
/wisp/
```

### Dependencies are missing

Delete the install directory and reinstall:

```bash
rm -rf node_modules
npm install
```

On Windows PowerShell:

```powershell
Remove-Item node_modules -Recurse -Force
npm install
```

## Environment

The project currently requires no secret environment variables.

Optional:

```env
PORT=8080
```

See `.env.example`.

## Project structure

```text
.
├── .vscode/
│   └── settings.json
├── public/
│   ├── app.js
│   ├── embed.js
│   ├── index.html
│   ├── psearch.js
│   ├── register-sw.js
│   ├── search.js
│   ├── sur.js
│   ├── sw.js
│   └── client-shim.js
├── src/
│   └── index.js
├── .env.example
├── .nvmrc
├── package.json
└── README.md
```
