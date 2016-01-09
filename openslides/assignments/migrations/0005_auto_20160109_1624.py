# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assignments', '0004_auto_20160109_1329'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='assignmentrelateduser',
            name='status',
        ),
        migrations.AddField(
            model_name='assignmentrelateduser',
            name='elected',
            field=models.BooleanField(default=False),
        ),
    ]
