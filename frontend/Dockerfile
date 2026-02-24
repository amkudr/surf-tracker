FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config template — BACKEND_URL is substituted at runtime
# Locally (docker-compose): BACKEND_URL=http://backend:8000
# Railway: BACKEND_URL=http://backend.railway.internal:<port>
COPY <<'TEMPLATE' /etc/nginx/templates/default.conf.template
server {
    listen ${PORT};
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location = /api {
        proxy_pass ${BACKEND_URL};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass ${BACKEND_URL}/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
TEMPLATE

# nginx:alpine auto-processes /etc/nginx/templates/*.template via envsubst
# Only substitute our vars, leaving nginx vars ($host, $uri etc.) untouched
ENV NGINX_ENVSUBST_FILTER="PORT|BACKEND_URL"
ENV PORT=80
ENV BACKEND_URL=http://backend:8000

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
