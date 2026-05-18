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

    resolver __DNS_RESOLVER__ valid=10s;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        set $backend __BACKEND_URL__;
        proxy_pass         $backend;
        proxy_set_header   Host $http_host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   X-Forwarded-Prefix /api;
        proxy_connect_timeout 5s;
        proxy_send_timeout    30s;
        proxy_read_timeout    30s;
    }
}
EOF

# Remove default nginx template dir
RUN rm -rf /etc/nginx/templates

# Change global nginx error log level to warn to suppress notices
RUN sed -i 's|^error_log.*|error_log /var/log/nginx/error.log warn;|' /etc/nginx/nginx.conf

# Custom entrypoint: generate nginx config + start nginx
RUN cat > /docker-entrypoint-custom.sh <<'SCRIPT'
#!/bin/sh
set -e
LISTEN_PORT="${PORT:-80}"
API_URL="${BACKEND_URL:-http://backend:8000}"
DNS_RESOLVER=$(grep -m1 '^nameserver' /etc/resolv.conf | awk '{print $2}')
# nginx requires IPv6 addresses wrapped in brackets
if echo "$DNS_RESOLVER" | grep -q ':'; then
    DNS_RESOLVER="[${DNS_RESOLVER}]"
fi

echo "nginx: using DNS resolver ${DNS_RESOLVER}"

sed "s|__LISTEN_PORT__|${LISTEN_PORT}|g; s|__BACKEND_URL__|${API_URL}|g; s|__DNS_RESOLVER__|${DNS_RESOLVER}|g" \
    /etc/nginx/nginx-template.conf > /etc/nginx/conf.d/default.conf

echo "nginx: listening on port ${LISTEN_PORT}, routing /api/ to ${API_URL}"
exec nginx -g 'daemon off;'
SCRIPT
RUN chmod +x /docker-entrypoint-custom.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint-custom.sh"]
