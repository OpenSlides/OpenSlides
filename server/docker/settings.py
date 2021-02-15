"""
Settings file for OpenSlides.

For more information on this file, see
https://github.com/OpenSlides/OpenSlides/blob/master/SETTINGS.rst
"""

import os
import json
from openslides.global_settings import *


class MissingEnvironmentVariable(Exception):
    pass


undefined = object()


def get_env(name, default=undefined, cast=str):
    env = os.environ.get(name)
    default_extension = ""
    if not env:
        env = default
        default_extension = " (default)"

    if env is undefined:
        raise MissingEnvironmentVariable(name)

    if env is not None:
        if cast is bool:
            env = env in ("1", "true", "True")
        else:
            env = cast(env)

    if env is None:
        print(f"{name}={default_extension}", flush=True)
    else:
        print(f'{name}="{env}"{default_extension}', flush=True)
    return env


# The directory for user specific data files

OPENSLIDES_USER_DATA_DIR = "/app/personal_data/var"

SECRET_KEY = get_env("SECRET_KEY")
DEBUG = False

# Controls the verbosity on errors during a reset password. If enabled, an error
# will be shown, if there does not exist a user with a given email address. So one
# can check, if a email is registered. If this is not wanted, disable verbose
# messages. An success message will always be shown.
RESET_PASSWORD_VERBOSE_ERRORS = get_env("RESET_PASSWORD_VERBOSE_ERRORS", True, bool)

# OpenSlides specific settings
AUTOUPDATE_DELAY = get_env("AUTOUPDATE_DELAY", 1, float)
DEMO_USERS = get_env("DEMO_USERS", default=None)
DEMO_USERS = json.loads(DEMO_USERS) if DEMO_USERS else None

# Email settings
# For an explaination and more settings values see https://docs.djangoproject.com/en/2.2/topics/email/#smtp-backend
EMAIL_HOST = get_env("EMAIL_HOST", "postfix")
EMAIL_PORT = get_env("EMAIL_PORT", 25, int)
EMAIL_HOST_USER = get_env("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = get_env("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_SSL = get_env("EMAIL_USE_SSL", False, bool)
EMAIL_USE_TLS = get_env("EMAIL_USE_TLS", False, bool)
EMAIL_TIMEOUT = get_env("EMAIL_TIMEOUT", None, int)
DEFAULT_FROM_EMAIL = get_env("DEFAULT_FROM_EMAIL", "noreply@example.com")

# Increasing Upload size to 100mb (default is 2.5mb)
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600

# Database
# https://docs.djangoproject.com/en/1.10/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "openslides",
        "USER": get_env("DATABASE_USER", "openslides"),
        "PASSWORD": get_env("DATABASE_PASSWORD", "openslides"),
        "HOST": get_env("DATABASE_HOST", "db"),
        "PORT": get_env("DATABASE_PORT", "5432"),
        "USE_TZ": False,  # Requires postgresql to have UTC set as default
        "DISABLE_SERVER_SIDE_CURSORS": True,
    },
    "mediafiles": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "mediafiledata",
        "USER": get_env("DATABASE_USER", "openslides"),
        "PASSWORD": get_env("DATABASE_PASSWORD", "openslides"),
        "HOST": get_env("DATABASE_HOST", "db"),
        "PORT": get_env("DATABASE_PORT", "5432"),
    },
}

# Redis
REDIS_HOST = get_env("REDIS_HOST", "redis")
REDIS_PORT = get_env("REDIS_PORT", 6379, int)
REDIS_SLAVE_HOST = get_env("REDIS_SLAVE_HOST", "redis-slave")
REDIS_SLAVE_PORT = get_env("REDIS_SLAVE_PORT", 6379, int)

# Collection Cache
REDIS_ADDRESS = f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
REDIS_READ_ONLY_ADDRESS = f"redis://{REDIS_SLAVE_HOST}:{REDIS_SLAVE_PORT}/0"
CONNECTION_POOL_LIMIT = get_env("CONNECTION_POOL_LIMIT", 100, int)

# SAML integration
ENABLE_SAML = get_env("ENABLE_SAML", False, bool)
if ENABLE_SAML:
    INSTALLED_APPS += ["openslides.saml"]

# Controls if electronic voting (means non-analog polls) are enabled.
ENABLE_ELECTRONIC_VOTING = get_env("ENABLE_ELECTRONIC_VOTING", False, bool)

# Enable Chat
ENABLE_CHAT = get_env("ENABLE_CHAT", False, bool)

# Jitsi integration
JITSI_DOMAIN = get_env("JITSI_DOMAIN", None)
JITSI_ROOM_NAME = get_env("JITSI_ROOM_NAME", None)
JITSI_ROOM_PASSWORD = get_env("JITSI_ROOM_PASSWORD", None)

TIME_ZONE = "Europe/Berlin"
STATICFILES_DIRS = [os.path.join(OPENSLIDES_USER_DATA_DIR, "static")] + STATICFILES_DIRS
STATIC_ROOT = os.path.join(OPENSLIDES_USER_DATA_DIR, "collected-static")
MEDIA_ROOT = os.path.join(OPENSLIDES_USER_DATA_DIR, "media", "")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "gunicorn": {
            "format": "{asctime} [{process:d}] [{levelname}] {name} {message}",
            "style": "{",
            "datefmt": "[%Y-%m-%d %H:%M:%S %z]",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "gunicorn",},
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": get_env("DJANGO_LOG_LEVEL", "INFO"),
        },
        "openslides": {
            "handlers": ["console"],
            "level": get_env("OPENSLIDES_LOG_LEVEL", "INFO"),
        },
    },
}

SETTINGS_FILEPATH = __file__
