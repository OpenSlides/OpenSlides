FROM python:3.5
RUN apt-get -y update && apt-get -y upgrade

RUN apt-get install -y libpq-dev supervisor curl vim
## BUILD JS STUFF
RUN wget https://nodejs.org/dist/v10.1.0/node-v10.1.0-linux-x64.tar.xz -P /tmp && \
  cd /tmp && tar xfvJ node-v10.1.0-linux-x64.tar.xz && \
  ln -sf /tmp/node-v10.1.0-linux-x64/bin/node /usr/bin/node
RUN useradd -m openslides
RUN mkdir /app
COPY package.json yarn.lock bower.json gulpfile.js /app/
WORKDIR /app
RUN chown -R openslides /app
USER openslides
RUN curl -o- -L https://yarnpkg.com/install.sh | bash
RUN $HOME/.yarn/bin/yarn --non-interactive

# INSTALL PYTHON DEPENDENCIES
USER root
COPY requirements_*.txt /app/
RUN pip install -r /app/requirements_big_mode.txt

## Clean up
RUN apt-get remove -y python3-pip wget curl
RUN rm -rf /var/lib/apt/lists/*

# BUILD APP
ADD . /app

RUN node_modules/.bin/gulp --production && \
  rm -fr /app/bower_components && \
  rm -fr /app/node_modules

RUN mkdir /data && chown openslides /data
USER openslides
EXPOSE 8000
USER openslides
VOLUME /supervisord.conf
VOLUME /data
