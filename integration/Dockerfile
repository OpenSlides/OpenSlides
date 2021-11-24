FROM cypress/base:10

WORKDIR /app
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm ci

COPY ./cypress-docker.json ./cypress.json
COPY ./resource-config-docker.js ./resource-config.js
COPY ./cypress ./cypress/

CMD ["npm", "run", "cypress:run"]