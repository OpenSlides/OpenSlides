# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_auto_20151210_0016'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='about_me',
            field=models.TextField(default='', blank=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='comment',
            field=models.TextField(default='', blank=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='default_password',
            field=models.CharField(default='', max_length=100, blank=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='first_name',
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='is_present',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='user',
            name='last_name',
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='structure_level',
            field=models.CharField(default='', max_length=255, blank=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='title',
            field=models.CharField(default='', max_length=50, blank=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='username',
            field=models.CharField(max_length=255, blank=True, unique=True),
        ),
    ]
