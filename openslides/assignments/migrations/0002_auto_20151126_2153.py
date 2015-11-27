# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assignments', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='assignmentoption',
            name='poll',
            field=models.ForeignKey(to='assignments.AssignmentPoll', related_name='options'),
        ),
        migrations.AlterField(
            model_name='assignmentvote',
            name='option',
            field=models.ForeignKey(to='assignments.AssignmentOption', related_name='votes'),
        ),
    ]
