from django.conf import settings
from django.db import migrations, models

import openslides.utils.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0001_initial'),
        ('contenttypes', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Item',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('item_number', models.CharField(blank=True, max_length=255, verbose_name='Number')),
                ('title', models.CharField(max_length=255, verbose_name='Title', null=True)),
                ('text', models.TextField(blank=True, verbose_name='Text', null=True)),
                ('comment', models.TextField(blank=True, verbose_name='Comment', null=True)),
                ('closed', models.BooleanField(default=False, verbose_name='Closed')),
                ('type', models.IntegerField(
                    verbose_name='Type',
                    default=1,
                    choices=[(1, 'Agenda item'), (2, 'Organizational item')],
                    max_length=1)),
                ('duration', models.CharField(blank=True, max_length=5, null=True)),
                ('weight', models.IntegerField(default=0, verbose_name='Weight')),
                ('object_id', models.PositiveIntegerField(blank=True, null=True)),
                ('speaker_list_closed', models.BooleanField(default=False, verbose_name='List of speakers is closed')),
                ('content_type', models.ForeignKey(blank=True, to='contenttypes.ContentType', null=True)),
                ('parent', models.ForeignKey(related_name='children', blank=True, to='agenda.Item', null=True)),
                ('tags', models.ManyToManyField(blank=True, to='core.Tag')),
            ],
            options={
                'permissions': (
                    ('can_see', 'Can see agenda'),
                    ('can_manage', 'Can manage agenda'),
                    ('can_see_orga_items', 'Can see orga items and time scheduling of agenda')),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Speaker',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('begin_time', models.DateTimeField(null=True)),
                ('end_time', models.DateTimeField(null=True)),
                ('weight', models.IntegerField(null=True)),
                ('item', models.ForeignKey(to='agenda.Item')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'permissions': (('can_be_speaker', 'Can put oneself on the list of speakers'),),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
    ]
