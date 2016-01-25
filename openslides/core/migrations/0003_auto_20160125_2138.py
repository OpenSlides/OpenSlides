# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_customslide_attachments'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='projector',
            options={'default_permissions': (), 'permissions': (
                ('can_see_projector', 'Can see the projector'),
                ('can_manage_projector', 'Can manage the projector'),
                ('can_see_frontpage', 'Can see the front page'))},
        ),
    ]
