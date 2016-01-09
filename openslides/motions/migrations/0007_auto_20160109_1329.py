# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models

import openslides.utils.models


class Migration(migrations.Migration):

    dependencies = [
        ('motions', '0006_auto_20160109_1145'),
    ]

    operations = [
        migrations.AlterField(
            model_name='category',
            name='name',
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name='category',
            name='prefix',
            field=models.CharField(max_length=32, blank=True),
        ),
        migrations.AlterField(
            model_name='motionpoll',
            name='votescast',
            field=openslides.utils.models.MinMaxIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='motionpoll',
            name='votesinvalid',
            field=openslides.utils.models.MinMaxIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='motionpoll',
            name='votesvalid',
            field=openslides.utils.models.MinMaxIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='motionversion',
            name='reason',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='motionversion',
            name='text',
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name='motionversion',
            name='title',
            field=models.CharField(max_length=255),
        ),
    ]
