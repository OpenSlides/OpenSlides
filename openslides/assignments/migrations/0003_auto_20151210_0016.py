# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('assignments', '0002_auto_20151126_2153'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='assignment',
            options={
                'permissions': (
                    ('can_see', 'Can see elections'),
                    ('can_nominate_other', 'Can nominate another participant'),
                    ('can_nominate_self', 'Can nominate oneself'),
                    ('can_manage', 'Can manage elections')),
                'ordering': ('title',),
                'default_permissions': (),
                'verbose_name': 'Election'},
        ),
        migrations.AlterModelOptions(
            name='assignmentoption',
            options={'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='assignmentpoll',
            options={'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='assignmentrelateduser',
            options={'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='assignmentvote',
            options={'default_permissions': ()},
        ),
    ]
