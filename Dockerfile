FROM python:3.7-slim
RUN apt -y update && \
  apt -y upgrade && \
  apt install -y libpq-dev supervisor curl wget xz-utils bzip2 git gcc gnupg2
RUN curl -sL https://deb.nodesource.com/setup_11.x | bash -
RUN apt -y install nodejs
RUN npm install -g @angular/cli@latest
RUN useradd -m openslides

## BUILD JS STUFF
RUN mkdir /app
WORKDIR /app
COPY . /app
RUN chown -R openslides /app
USER openslides
RUN ng config -g cli.warnings.versionMismatch false && \
  cd client && \
  npm install
RUN cd client && \
  ng build --prod

# INSTALL PYTHON DEPENDENCIES
USER root
RUN pip install .[big_mode]

## Clean up
RUN apt-get remove -y python3-pip wget curl
RUN rm -rf /var/lib/apt/lists/* && \
  rm -fr /app/client/node_modules

RUN mkdir /data && chown openslides /data
USER openslides
EXPOSE 8000
VOLUME /supervisord.conf
VOLUME /data
