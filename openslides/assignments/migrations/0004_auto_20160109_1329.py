# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models

import openslides.utils.models


class Migration(migrations.Migration):

    dependencies = [
        ('assignments', '0003_auto_20151210_0016'),
    ]

    operations = [
        migrations.AlterField(
            model_name='assignment',
            name='description',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='assignment',
            name='open_posts',
            field=models.PositiveSmallIntegerField(),
        ),
        migrations.AlterField(
            model_name='assignment',
            name='poll_description_default',
            field=models.CharField(max_length=79, blank=True),
        ),
        migrations.AlterField(
            model_name='assignment',
            name='title',
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name='assignmentpoll',
            name='description',
            field=models.CharField(max_length=79, blank=True),
        ),
        migrations.AlterField(
            model_name='assignmentpoll',
            name='votescast',
            field=openslides.utils.models.MinMaxIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='assignmentpoll',
            name='votesinvalid',
            field=openslides.utils.models.MinMaxIntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='assignmentpoll',
            name='votesvalid',
            field=openslides.utils.models.MinMaxIntegerField(blank=True, null=True),
        ),
    ]
