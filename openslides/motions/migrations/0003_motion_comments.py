# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


def change_motions_comments(apps, schema_editor):
    """
    Index the comments fields in the config. Changing from an array to a dict with the
    ids as keys. CHange all motions from an array for comments to a dict with the comments
    field id as key to link motion comments and comments fields.
    """
    # We get the model from the versioned app registry;
    # if we directly import it, it will be the wrong version.
    ConfigStore = apps.get_model("core", "ConfigStore")
    Motion = apps.get_model("motions", "Motion")

    try:
        config_comments_fields = ConfigStore.objects.get(key="motions_comments").value
    except ConfigStore.DoesNotExist:
        config_comments_fields = []  # The old default: An empty list.

    comments_fields = {}
    for index, field in enumerate(config_comments_fields):
        comments_fields[index + 1] = field

    max_index = len(config_comments_fields) - 1

    try:
        db_value = ConfigStore.objects.get(key="motions_comments")
    except ConfigStore.DoesNotExist:
        db_value = ConfigStore(key="motions_comments")
    db_value.value = comments_fields
    # We cannot provide skip_autoupdate=True here, becuase this object is a fake object. It does *not*
    # inherit from the RESTModelMixin, so the save() methos from base_model.py (django's default)
    # gets called. This is because we are in the core app and try to save a core model. See
    # comments in PR #3376.
    db_value.save()

    for motion in Motion.objects.all():
        comments = {}
        for index, comment in enumerate(motion.comments or []):
            if index > max_index:
                break
            comments[index + 1] = comment
        motion.comments = comments
        motion.save(skip_autoupdate=True)


class Migration(migrations.Migration):

    dependencies = [("motions", "0002_misc_features")]

    operations = [migrations.RunPython(change_motions_comments)]
