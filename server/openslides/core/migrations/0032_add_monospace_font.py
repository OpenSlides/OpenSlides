# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations

from openslides.core.config import config


def update_available_fonts(apps, schema_editor):
    ConfigStore = apps.get_model("core", "ConfigStore")

    try:
        fonts = ConfigStore.objects.get(key="fonts_available")
    except ConfigStore.DoesNotExist:
        return  # The key is not in the database, nothing to change here

    default_fonts = config.config_variables["fonts_available"].default_value

    fonts.value = default_fonts
    fonts.save()


class Migration(migrations.Migration):

    dependencies = [("core", "0031_projector_default_height")]

    operations = [migrations.RunPython(update_available_fonts)]
