# Static-only image: nginx serves the built SPA and the browser calls the
# official open-data APIs directly. There is no backend or proxy to deploy.
FROM node:24-alpine AS web
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web /web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
