FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Write nginx config with safe placeholders (not $-prefixed, so envsubst won't touch them)
RUN cat > /etc/nginx/nginx-template.conf <<'EOF'
server {
    listen __LISTEN_PORT__;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location = /api {
        proxy_pass __BACKEND_URL__;
        proxy_ssl_server_name on;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass __BACKEND_URL__/;
        proxy_ssl_server_name on;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Remove default nginx template dir to prevent envsubst from running
RUN rm -rf /etc/nginx/templates

# Custom entrypoint: substitute only our placeholders via sed
RUN cat > /docker-entrypoint-custom.sh <<'SCRIPT'
#!/bin/sh
set -e
LISTEN_PORT="${PORT:-80}"
BACKEND="${BACKEND_URL:-http://backend:8000}"

sed "s|__LISTEN_PORT__|${LISTEN_PORT}|g; s|__BACKEND_URL__|${BACKEND}|g" \
    /etc/nginx/nginx-template.conf > /etc/nginx/conf.d/default.conf

echo "nginx config: listen=${LISTEN_PORT}, backend=${BACKEND}"
exec nginx -g 'daemon off;'
SCRIPT
RUN chmod +x /docker-entrypoint-custom.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint-custom.sh"]
