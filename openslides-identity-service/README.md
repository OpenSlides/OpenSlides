# OpenSlides Identity Service

The identity service provides a who-am-i route designed for the client.

No credentials are allowed to be stored SPA client. The proxy/traefik is used instead for authentication.
For this, the client needs a proxied route in order to convert the traefik cookies into an OIDC (specifically Keycloak) JWT token.

The identity-service verifies the JWTs signature. It then reads and returns the OpenSlides User ID from the JWT token.
