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

    location /api/ {
        proxy_pass         http://backend:8000/;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
EOF

# Remove default nginx template dir
RUN rm -rf /etc/nginx/templates

# Custom entrypoint: generate nginx config + start nginx
RUN cat > /docker-entrypoint-custom.sh <<'SCRIPT'
#!/bin/sh
set -e
LISTEN_PORT="${PORT:-80}"

# Generate nginx config
sed "s|__LISTEN_PORT__|${LISTEN_PORT}|g" \
    /etc/nginx/nginx-template.conf > /etc/nginx/conf.d/default.conf

echo "nginx: listening on port ${LISTEN_PORT}"
exec nginx -g 'daemon off;'
SCRIPT
RUN chmod +x /docker-entrypoint-custom.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint-custom.sh"]
