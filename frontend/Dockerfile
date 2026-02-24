FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL is baked in at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Simple SPA config — no reverse proxy, just serve static files
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

# Custom entrypoint: substitute port via sed
RUN cat > /docker-entrypoint-custom.sh <<'SCRIPT'
#!/bin/sh
set -e
LISTEN_PORT="${PORT:-80}"

sed "s|__LISTEN_PORT__|${LISTEN_PORT}|g" \
    /etc/nginx/nginx-template.conf > /etc/nginx/conf.d/default.conf

echo "nginx: listening on port ${LISTEN_PORT}"
exec nginx -g 'daemon off;'
SCRIPT
RUN chmod +x /docker-entrypoint-custom.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint-custom.sh"]
