# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('motions', '0004_auto_20151105_2312'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='category',
            options={'ordering': ['prefix'], 'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='motion',
            options={
                'ordering': ('identifier',),
                'verbose_name': 'Motion',
                'default_permissions': (),
                'permissions': (
                    ('can_see', 'Can see motions'),
                    ('can_create', 'Can create motions'),
                    ('can_support', 'Can support motions'),
                    ('can_manage', 'Can manage motions'))},
        ),
        migrations.AlterModelOptions(
            name='motionlog',
            options={'ordering': ['-time'], 'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='motionoption',
            options={'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='motionpoll',
            options={'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='motionversion',
            options={'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='motionvote',
            options={'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='state',
            options={'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='workflow',
            options={'default_permissions': ()},
        ),
    ]
