# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('mediafiles', '0003_auto_20150917_1226'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='mediafile',
            options={
                'permissions': (
                    ('can_see', 'Can see the list of files'),
                    ('can_upload', 'Can upload files'),
                    ('can_manage', 'Can manage files')),
                'ordering': ['title'],
                'default_permissions': ()},
        ),
    ]
