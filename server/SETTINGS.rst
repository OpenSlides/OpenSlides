==========================
 OpenSlides configuration
==========================

First, locate your `settings.py`. Since this is a regular python file,
experienced users can also write more advanced configurations with e.g. swithing
between two sets of configs. This also means, that the syntax need to be correct
for OpenSlides to start.

All presented settings must be written `<SETTINGS_NAME> = <value>` to follow the
correct syntax.

The `settings.py` is just an extension for Django settings. Please visit the
`Django settings documentation
<https://docs.djangoproject.com/en/2.2/ref/settings/>`_ to get an overview about
all existing settings.


SECURITY
========

For `DEBUG` and `SECRET_KEY` see the sections in the django settings
documenataion.

`RESET_PASSWORD_VERBOSE_ERRORS`: Default: `True`. Set to `False` to disable.
Controls the verbosity on errors during a reset password. If enabled, an error
will be shown, if there does not exist a user with a given email address. So one
can check, if a email is registered. If this is not wanted, disable verbose
messages. An success message will always be shown.

`AUTH_PASSWORD_VALIDATORS`: Add custom password validators, e.g. a min-length
validator. See `django auth docs
<https://docs.djangoproject.com/en/2.2/topics/auth/passwords/#module-django.contrib.auth.password_validation>`_
for mor information.


Directories
===========

`OPENSLIDES_USER_DATA_DIR`: The path, where all user data is saved, like static
files, mediafiles and the default database. This path can be different to the
location of the `settings.py`.

`STATICFILES_DIRS` and `STATIC_ROOT`: Managing static files. Because the clint
is not delivered by the server anymore, these settings are obsolete.

`MEDIA_ROOT`: The location of mediafiles. The default is a `media` folder inside
`OPENSLIDES_USER_DATA_DIR`, but can be altered to another path.


Email
=====

Please refer to the Django settings documentation. A changed email backend is
useful for debugging to print all email the the console::

    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


Electronic voting
=================

Electronic voting is disabled by default, so only analog polls are available.
To enable it, set::

    ENABLE_ELECTRONIC_VOTING = True


Jitsi integration
=================

To enable the audio conference with Jitsi Meet, you have to set the following variables:

- `JITSI_DOMAIN`: must contain an url to a Jitsi server
- `JITSI_ROOM_NAME`: the name of the room that should be used
- `JITSI_ROOM_PASSWORD`: (optional) the password of the room. Will be applied automatically from the settings.


Logging
=======

To setup basic logging see `logging
<https://docs.djangoproject.com/en/2.2/topics/logging/>`_.
We recommend to enable all OpenSlides related logging with level `INFO` per
default::

    LOGGING = {
       'formatters': {
           'lessnoise': {
               'format': '[{levelname}] {name} {message}',
               'style': '{',
               'datefmt': '[%Y-%m-%d %H:%M:%S %z]',
           },
       },
       'handlers': {
           'console': {
               'class': 'logging.StreamHandler',
               'formatter': 'lessnoise',
           },
       },
       'loggers': {
           'openslides': {
               'handlers': ['console'],
               'level': os.getenv('OPENSLIDES_LOG_LEVEL', 'INFO'),
           },
       },
    }

With the environment variable `OPENSLIDES_LOG_LEVEL` the level can be adjusted
without changing the `settings.py`.


Big mode and caching
====================

When running multiple workers redis is required as a message broker between the
workers. Set `use_redis = True` to enable redis and visit `OpenSLides in big
mode
<https://github.com/OpenSlides/OpenSlides/blob/master/DEVELOPMENT.rst#openslides-in-big-mode>`_.

When seting `use_redis = True`, three settings are important:

- Caching: `REDIS_ADDRESS` is used to provide caching with redis across all
  workers.
- Channels: The "message queue" for the workers. Adjust the `hosts`-part to the
  redis address.
- Sessions: All sessions are managed in redis to ensure them across all workers.
  Please adjust the `SESSION_REDIS` fields to point to the redis instance.


Advanced
========

`PING_INTERVAL` and `PING_TIMEOUT` are settings for the clients how frequently
to ping the server (interval) and how big is the timeout. If a ping took longer
than the timeout, the clients does a forced reconnect.

`COMPRESSION`: Enable or disables the compression when sending data. This does
not affect the client.

`PRIORITIZED_GROUP_IDS`: A list of group ids. If one client is logged in and the
operator is in one of these groups, the client disconnected and reconnects again.
All requests urls (including websockets) are now prefixed with `/prioritize`, so
these requests from "prioritized clients" can be routed to different servers.

`AUTOUPDATE_DELAY`: The delay to send autoupdates. This feature can be
deactivated by setting it to `None`. It is deactivated per default. The Delay is
given in seconds

`DEMO_USERS`: Apply special settings for demo use cases. A list of protected user ids
handlers to be given. Updating these users (also password) is not allowed. Some bulk
actions like resetting password are completly disabled. Irrelevant for normal use cases.