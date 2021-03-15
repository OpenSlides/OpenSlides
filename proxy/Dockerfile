FROM caddy:2.3.0-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint /entrypoint
COPY certs /certs

ENTRYPOINT ["/entrypoint"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
