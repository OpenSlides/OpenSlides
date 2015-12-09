# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_clear_default_countdown'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='chatmessage',
            options={'permissions': (('can_use_chat', 'Can use the chat'),), 'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='configstore',
            options={'permissions': (('can_manage_config', 'Can manage configuration'),), 'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='customslide',
            options={'ordering': ('weight', 'title'), 'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='projector',
            options={
                'permissions': (
                    ('can_see_projector', 'Can see the projector'),
                    ('can_manage_projector', 'Can manage the projector'),
                    ('can_see_dashboard', 'Can see the dashboard')),
                'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='tag',
            options={'permissions': (('can_manage_tags', 'Can manage tags'),), 'ordering': ('name',), 'default_permissions': ()},
        ),
    ]
