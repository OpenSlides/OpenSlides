# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations

from openslides.core.config import config


def change_font_default_path(apps, schema_editor):
    """
    Writes the new default font path into the database.
    """
    ConfigStore = apps.get_model("core", "ConfigStore")

    try:
        font_regular = ConfigStore.objects.get(key="font_regular")
        font_italic = ConfigStore.objects.get(key="font_italic")
        font_bold = ConfigStore.objects.get(key="font_bold")
        font_bold_italic = ConfigStore.objects.get(key="font_bold_italic")
    except ConfigStore.DoesNotExist:
        return  # The key is not in the database, nothing to change here

    default_font_regular = config.config_variables["font_regular"].default_value
    default_font_italic = config.config_variables["font_italic"].default_value
    default_font_bold = config.config_variables["font_bold"].default_value
    default_font_bold_italic = config.config_variables["font_bold_italic"].default_value

    font_regular.value = default_font_regular
    font_italic.value = default_font_italic
    font_bold.value = default_font_bold
    font_bold_italic.value = default_font_bold_italic

    font_regular.save()
    font_italic.save()
    font_bold.save()
    font_bold_italic.save()


class Migration(migrations.Migration):

    dependencies = [("core", "0013_auto_20190119_1641")]

    operations = [migrations.RunPython(change_font_default_path)]
