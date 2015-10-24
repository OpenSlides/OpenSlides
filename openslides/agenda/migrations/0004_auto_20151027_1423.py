from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agenda', '0003_auto_20150904_1732'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='item',
            options={
                'permissions': (
                    ('can_see', 'Can see agenda'),
                    ('can_manage', 'Can manage agenda'),
                    ('can_see_hidden_items',
                     'Can see hidden items and time scheduling of agenda'))},
        ),
        migrations.AlterField(
            model_name='item',
            name='type',
            field=models.IntegerField(
                choices=[(1, 'Agenda item'), (2, 'Hidden item')],
                verbose_name='Type',
                default=1),
        ),
        migrations.AlterUniqueTogether(
            name='item',
            unique_together=set([('content_type', 'object_id')]),
        ),
        migrations.RemoveField(
            model_name='item',
            name='tags',
        ),
        migrations.RemoveField(
            model_name='item',
            name='text',
        ),
        migrations.RemoveField(
            model_name='item',
            name='title',
        ),
    ]
