# Deployment

## Direct Node.js

```bash
npm install
npm start
curl http://127.0.0.1:8080/health
```

## Docker

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:8080/health
```

## Nginx

Copy `deploy/nginx/imagination.conf` to your Nginx site configuration and replace
`server_name _;` with your domain. Test with `sudo nginx -t` before reloading.

The WebSocket upgrade headers are required because the Wisp transport uses WebSockets.

## systemd

Copy the service file to `/etc/systemd/system/imagination.service`, adjust
`WorkingDirectory`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now imagination
sudo systemctl status imagination
```
