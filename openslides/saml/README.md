
# OpenSlides SAML Plugin

This app for OpenSlides provides a login via a SAML single-sign-on service.

## Requirements

Install `python3-saml` via `pip install python3-saml`.

Note: python3-saml needs thy python package `xmlsec <https://pypi.python.org/pypi/xmlsec/1.3.3>`_ which depends on `libxml2 <http://xmlsoft.org/>`_. Those packages need to be installed on a Debian-like system::

    $ apt-get install libxml2-dev libxmlsec1-dev libxmlsec1-openssl pkg-config

For more information about other operating systems or distributions visit http://pythonhosted.org/xmlsec/install.html.


## Configuration

Enable the feature by setting ``ENABLE_SAML=True`` in the ``settings.py``. Make sure you
have installed the extra dependencies from the section above.

On startup of OpenSlides the ``saml_settings.json`` is created in the settings folder if
it does not exist. To force creating this file run

    $ python manage.py create-saml-settings [--dir /<path to custom settings dir>/]

The path has to match with the settings path OpenSlides is started with.

For the first part in the settings file refer to `python3-saml settings documentation
<https://github.com/onelogin/python3-saml#settings>`_. All settings described there are
merged into the ``saml_settings.json``. Also note the ``README`` file in the ``certs``
folder next to the ``saml_settings.json``.

## Additional Settings

The following settings are given in the `saml_settings.json`. All entries are required, except for the request settings.

### General settings
Here you can provide a custom text for the SAML login button. The `changePasswordUrl`
redirects the user to the given URL when click on `Change password` in the OpenSlides user
menu.

### Attributes
The identity provider sends attributes to the server if a user sucessfully logged in. To
map these attributes to attributes of OpenSlides users, the section `attributeMapping`
exists. The structure is like this::

    "attributeMapping: {
        "attributeFromIDP": ["attributeOfOpenSlidesUser", <used for lookup>],
        "anotherAttributeFromIDP": ["anotherAttributeOfOpenSlidesUser", <used for lookup>]
    }

All available OpenSlides user attributes are:

- ``username``: Has to be unique. Identifies the user.
- ``first_name``: The user's first name.
- ``last_name``: The user's last name.
- ``title``: The title of the user, e.g. "Dr.".
- ``email``: The user's email addreess.
- ``structure_level``: The structure level.
- ``number``: The participant number (text, not an actual number). Note: This field is not unique.
- ``about_me``: A free text field.
- ``is_active``, ``is_present``, ``is_committee``: Boolean flags.

To get detailed information see the [models.py](https://github.com/OpenSlides/OpenSlides/blob/master/openslides/users/models.py)

The ``<used for lookup>`` has either to be ``true`` or ``false``. All attributes with this
value being true are used to search for an existing user. If the user is found, the user gets
updated with all changed values and used to log in. If the user is not found, it will be
created with all values given. Try to choose unique attributes (e.g. the username),
attributes you are sure about to be unique (e.g. maybe the number) or use a combination of
attributes.

### Requests

One can overwrite the data extracted from the request headers of saml-requests. E.g. if the public port is 80 and the server is reverse-proxied and listen to port 8000, one should set the `server_port` to 80, so OpenSlides does not take the port of the request header. If not specified all these values are taken from the requests meta information:

- ``https``: Either ``on`` or ``off``.
- ``http_host``: The hostname.
- ``script_name``: The aquivalent to ``PATH_INFO`` in the meta values.
- ``server_port``: The port listen by the server.

### Default group ids

If the optional key `defaultGroupIds` is given, these groups are assigned to
each new created user on each saml login. It must be a list of ids. To disable
this feature, either just do not inlcude this key, or set it to `null`.
