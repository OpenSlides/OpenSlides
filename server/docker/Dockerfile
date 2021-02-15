FROM python:3.7-slim AS base

ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes
ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE 1

# Variables relevant for CMD
ENV DJANGO_SETTINGS_MODULE settings
ENV PYTHONPATH personal_data/var/

RUN mkdir -p /app
WORKDIR /app
RUN useradd -m openslides
RUN chown -R openslides /app

RUN apt-get -y update && apt-get -y upgrade && \
  apt-get install --no-install-recommends -y \
    apt-transport-https \
    bzip2 \
    curl \
    g++ \
    gcc \
    git \
    gnupg2 \
    libpq-dev \
    make \
    postgresql-client \
    rsync \
    wait-for-it \
    wget \
    xz-utils \
    zlib1g-dev \
    libffi-dev # install of zlib1g-dev and libffi-dev is required on armhf architectures

# Install additional tools
RUN apt-get install --no-install-recommends -y \
  dnsutils \
  iputils-ping \
  netcat \
  procps \
  traceroute

# Install saml requirements
RUN apt-get install --no-install-recommends -y \
  libxml2-dev \
  libxmlsec1-dev \
  libxmlsec1-openssl \
  pkg-config

RUN rm -rf /var/lib/apt/lists/*

COPY requirements /app/requirements
RUN pip install -r requirements/production.txt -r requirements/saml.txt && \
    rm -rf /root/.cache/pip

# SAML
COPY docker/saml-setup.sh /usr/local/lib/
RUN mkdir -p /app/personal_data/var/certs/ && \
      chown -R openslides:openslides /app/personal_data/var/

USER openslides
# the `empty` folder is used for the dummy http server für the migrate entrypoint to serve no files.
RUN mkdir /app/empty
COPY docker/entrypoint /usr/local/sbin/
COPY docker/entrypoint-db-setup /usr/local/sbin/
COPY docker/settings.py /app/personal_data/var/settings.py
COPY manage.py /app/
COPY openslides /app/openslides
COPY docker/server-version.txt /app/openslides/core/static/server-version.txt
ENTRYPOINT ["/usr/local/sbin/entrypoint"]
CMD ["gunicorn", "-w", "8", "--preload", "-t", "240", "-b", "0.0.0.0:8000", "openslides.wsgi"]
