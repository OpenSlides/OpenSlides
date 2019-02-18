FROM python:3.7-slim

RUN mkdir /app

RUN apt -y update && \
  apt -y upgrade && \
  apt install -y libpq-dev curl wget xz-utils bzip2 git gcc gnupg2 make g++
RUN curl -sL https://deb.nodesource.com/setup_11.x | bash -
RUN apt -y install nodejs
RUN npm install -g @angular/cli@latest
RUN useradd -m openslides
RUN chown -R openslides /app
WORKDIR /app
COPY . /app
RUN rm -rf /app/.virtualenv* && \
  rm -rf /app/client/node_modules
RUN chown -R openslides /app

# Installing python dependencies
RUN pip install -r requirements.txt
RUN rm -rf /var/lib/apt/lists/*

# installing client
USER openslides
RUN ng config -g cli.warnings.versionMismatch false && \
  cd client && \
  npm install
RUN cd client && \
  npm run build && \
  ./node_modules/.bin/compodoc -t -p src/tsconfig.app.json -n 'OpenSlides Documentation' -d ../openslides/static/doc -e html
