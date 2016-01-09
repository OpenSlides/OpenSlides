# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mediafiles', '0002_auto_20160110_0103'),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='customslide',
            name='attachments',
            field=models.ManyToManyField(to='mediafiles.Mediafile', blank=True),
        ),
    ]
