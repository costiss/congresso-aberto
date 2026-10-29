# Host-network e-Cidadania sidecar. Deploy it with `network_mode: host`.
FROM nginx:alpine
COPY deploy/10-ecidadania-cache.sh /docker-entrypoint.d/10-ecidadania-cache.sh
RUN chmod +x /docker-entrypoint.d/10-ecidadania-cache.sh
COPY deploy/ecidadania-proxy.conf /etc/nginx/conf.d/default.conf
