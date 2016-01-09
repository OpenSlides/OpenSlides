# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mediafiles', '0005_auto_20160109_1145'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mediafile',
            name='mediafile',
            field=models.FileField(upload_to='file'),
        ),
        migrations.AlterField(
            model_name='mediafile',
            name='title',
            field=models.CharField(max_length=255, blank=True, unique=True),
        ),
        migrations.AlterField(
            model_name='mediafile',
            name='uploader',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to=settings.AUTH_USER_MODEL, null=True),
        ),
    ]
