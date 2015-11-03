# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('motions', '0003_auto_20150904_2029'),
    ]

    operations = [
        migrations.RenameField(
            model_name='state',
            old_name='icon',
            new_name='css_class',
        ),
        migrations.AlterField(
            model_name='state',
            name='css_class',
            field=models.CharField(max_length=255, default='primary'),
        ),
        migrations.AlterField(
            model_name='state',
            name='workflow',
            field=models.ForeignKey(to='motions.Workflow', related_name='states'),
        ),
    ]
