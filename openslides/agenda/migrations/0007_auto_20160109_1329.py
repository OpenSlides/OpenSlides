# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agenda', '0006_auto_20160109_1145'),
    ]

    operations = [
        migrations.AlterField(
            model_name='item',
            name='closed',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='item',
            name='comment',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='item',
            name='item_number',
            field=models.CharField(max_length=255, blank=True),
        ),
        migrations.AlterField(
            model_name='item',
            name='speaker_list_closed',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='item',
            name='type',
            field=models.IntegerField(default=1, choices=[(1, 'Agenda item'), (2, 'Hidden item')]),
        ),
        migrations.AlterField(
            model_name='item',
            name='weight',
            field=models.IntegerField(default=0),
        ),
    ]
