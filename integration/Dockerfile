FROM cypress/included:8.4.0

WORKDIR /app

COPY ./cypress ./cypress/
COPY ./cypress-docker.json ./cypress.json

COPY entrypoint.sh /usr/local/bin/entrypoint
ENTRYPOINT entrypoint
