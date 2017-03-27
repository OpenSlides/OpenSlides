Example Data Generator
======================

This is a plugin to provide a management command to generate example data
for OpenSlides. Add this module to your personal settings.py.

    INSTALLED_PLUGINS += (
        'tests.example_data_generator',
    )

Then run::

    $ python manage.py create-example-data
