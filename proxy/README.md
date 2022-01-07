# OpenSlides Proxy

The proxy is the entrypoint for traffic going into an OpenSlides instance and
hides all the services needed for production behind a single port. On the
docker container this will be port 8000. An arbitrary port from the host can
then be forwarded to that (e.g. 443->8000).

## HTTPS

It is possible to make use of caddy's automatic https feature in order to not
having to manually generate TLS certificates.
Set `ENABLE_AUTO_HTTPS=1` and `EXTERNAL_ADDRESS=openslides.example.com` to
activate it. Caddy will then retrieve a letsencrypt certificate for that
domain.
For testing a setup e.g.
`ACME_ENDPOINT=https://acme-staging-v02.api.letsencrypt.org/directory` can also
be set to avoid hitting rate limits.
Importantly, port 80 on the host must be forwarded to port 8001 on which caddy
will answer the ACME-challenge during certificate retrieval.

Alternatively a locally generated certificate can be used by setting
`ENABLE_LOCAL_HTTPS=1 HTTPS_CERT_FILE=path/to/crt HTTPS_CERT_FILE=path/to/key`
and providing cert and key files at the specified location. This is mostly for
dev and testing setups and is not useful for a public domain as the cert is not
issued by a trusted CA and therefore not trusted by browsers. If set, this
overrules `ENABLE_AUTO_HTTPS`.
