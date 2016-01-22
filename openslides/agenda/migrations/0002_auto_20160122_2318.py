# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agenda', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='item',
            name='type',
            field=models.IntegerField(default=2, choices=[(1, 'Agenda item'), (2, 'Hidden item')]),
        ),
    ]
