FROM node:14 AS nodejs

RUN mkdir -p /build/app
WORKDIR /build/app
RUN useradd -m openslides
RUN chown -R openslides /build/app

USER root
RUN npm install -g @angular/cli@^10
RUN ng config -g cli.warnings.versionMismatch false

USER openslides
COPY package.json package-lock.json ./
RUN npm -v
RUN npm ci
COPY browserslist *.json ./
COPY src ./src
RUN npm run build-to-dir /build/app/static

COPY docker/client-version.txt static/

FROM nginx
COPY --from=nodejs /build/app/static /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf
