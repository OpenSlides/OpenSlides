# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('agenda', '0004_auto_20151027_1423'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='item',
            options={
                'permissions': (
                    ('can_see', 'Can see agenda'),
                    ('can_manage', 'Can manage agenda'),
                    ('can_see_hidden_items', 'Can see hidden items and time scheduling of agenda')),
                'default_permissions': ()},
        ),
        migrations.AlterModelOptions(
            name='speaker',
            options={'permissions': (('can_be_speaker', 'Can put oneself on the list of speakers'),), 'default_permissions': ()},
        ),
    ]
