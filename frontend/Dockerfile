FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Simple SPA nginx config
RUN cat > /etc/nginx/nginx-template.conf <<'EOF'
server {
    listen __LISTEN_PORT__;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Remove default nginx template dir
RUN rm -rf /etc/nginx/templates

# Custom entrypoint: inject runtime config + start nginx
RUN cat > /docker-entrypoint-custom.sh <<'SCRIPT'
#!/bin/sh
set -e
LISTEN_PORT="${PORT:-80}"

# Generate nginx config
sed "s|__LISTEN_PORT__|${LISTEN_PORT}|g" \
    /etc/nginx/nginx-template.conf > /etc/nginx/conf.d/default.conf

# Inject runtime API URL into a JS file loaded before the app
if [ -n "$VITE_API_URL" ]; then
  echo "window.__API_URL__ = '${VITE_API_URL}';" > /usr/share/nginx/html/config.js
  echo "Injected API URL: ${VITE_API_URL}"
else
  echo "// no runtime API URL configured" > /usr/share/nginx/html/config.js
fi

echo "nginx: listening on port ${LISTEN_PORT}"
exec nginx -g 'daemon off;'
SCRIPT
RUN chmod +x /docker-entrypoint-custom.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint-custom.sh"]
