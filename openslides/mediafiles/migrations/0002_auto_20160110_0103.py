# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mediafiles', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='mediafile',
            name='title',
            field=models.CharField(max_length=255, unique=True),
        ),
    ]
