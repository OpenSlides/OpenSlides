# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_auto_20151210_0016'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chatmessage',
            name='message',
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name='chatmessage',
            name='user',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='customslide',
            name='text',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='customslide',
            name='title',
            field=models.CharField(max_length=256),
        ),
        migrations.AlterField(
            model_name='customslide',
            name='weight',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='tag',
            name='name',
            field=models.CharField(max_length=255, unique=True),
        ),
    ]
