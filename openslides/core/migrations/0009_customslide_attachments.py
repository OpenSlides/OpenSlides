# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mediafiles', '0004_auto_20151210_0016'),
        ('core', '0008_auto_20151210_0016'),
    ]

    operations = [
        migrations.AddField(
            model_name='customslide',
            name='attachments',
            field=models.ManyToManyField(to='mediafiles.Mediafile', verbose_name='Attachments', blank=True),
        ),
    ]
