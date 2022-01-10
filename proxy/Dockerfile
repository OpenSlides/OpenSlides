FROM caddy:2.3.0-alpine

LABEL org.opencontainers.image.title="OpenSlides Proxy"
LABEL org.opencontainers.image.description="The proxy is the entrypoint for traffic going into an OpenSlides instance."
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/OpenSlides/OpenSlides/tree/main/proxy"

RUN apk update && apk add --no-cache jq gettext

COPY caddy_base.json /caddy_base.json
COPY entrypoint /entrypoint
COPY certs /certs

ENTRYPOINT ["/entrypoint"]
CMD ["caddy", "run", "--config", "/etc/caddy/config.json"]
