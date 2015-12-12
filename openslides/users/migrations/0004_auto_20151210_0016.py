# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_auto_20151021_2320'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='user',
            options={
                'permissions': (
                    ('can_see_name', 'Can see names of users'),
                    ('can_see_extra_data', 'Can see extra data of users'),
                    ('can_manage', 'Can manage users')),
                'ordering': ('last_name', 'first_name', 'username'),
                'default_permissions': ()},
        ),
    ]
