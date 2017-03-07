# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2016-12-11 21:13
from __future__ import unicode_literals

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import openslides.utils.models


def move_custom_slides_to_topics(apps, schema_editor):
    """
    Move all custom slides to new topic model.
    """
    # We get the model from the versioned app registry;
    # if we directly import it, it will be the wrong version.
    ContentType = apps.get_model('contenttypes', 'ContentType')
    CustomSlide = apps.get_model('core', 'CustomSlide')
    Item = apps.get_model('agenda', 'Item')
    Topic = apps.get_model('topics', 'Topic')

    # Copy data.
    content_type_custom_slide = ContentType.objects.get_for_model(CustomSlide)
    content_type_topic = ContentType.objects.get_for_model(Topic)
    for custom_slide in CustomSlide.objects.all():
        # This line does not create a new Item because this migration model has
        # no method 'get_agenda_title()'. See agenda/signals.py.
        topic = Topic.objects.create(title=custom_slide.title, text=custom_slide.text)
        topic.attachments.add(*custom_slide.attachments.all())
        item = Item.objects.get(object_id=custom_slide.pk, content_type=content_type_custom_slide)
        item.object_id = topic.pk
        item.content_type = content_type_topic
        item.save(skip_autoupdate=True)

    # Delete old data.
    CustomSlide.objects.all().delete()
    content_type_custom_slide.delete()


def name_default_projector(apps, schema_editor):
    """
    Set the name of the default projector to 'Defaultprojector'
    """
    Projector = apps.get_model('core', 'Projector')
    Projector.objects.filter(pk=1).update(name='Default projector')


def remove_old_countdowns_messages(apps, schema_editor):
    """
    Remove old countdowns and messages created by 2.0 from projector elements which are unusable in 2.1.
    """
    Projector = apps.get_model('core', 'Projector')
    projector = Projector.objects.get(pk=1)

    projector_config = projector.config
    for key, value in list(projector.config.items()):
        if value.get('name') in ('core/countdown', 'core/message'):
            del projector_config[key]
    projector.config = projector_config
    projector.save(skip_autoupdate=True)


def add_projection_defaults(apps, schema_editor):
    """
    Adds projectiondefaults for messages and countdowns.
    """
    Projector = apps.get_model('core', 'Projector')
    ProjectionDefault = apps.get_model('core', 'ProjectionDefault')
    # The default projector (pk=1) is always available.
    default_projector = Projector.objects.get(pk=1)

    projectiondefaults = []

    projectiondefaults.append(ProjectionDefault(
        name='agenda_all_items',
        display_name='Agenda',
        projector=default_projector))
    projectiondefaults.append(ProjectionDefault(
        name='topics',
        display_name='Topics',
        projector=default_projector))
    projectiondefaults.append(ProjectionDefault(
        name='agenda_list_of_speakers',
        display_name='List of speakers',
        projector=default_projector))
    projectiondefaults.append(ProjectionDefault(
        name='agenda_current_list_of_speakers',
        display_name='Current list of speakers',
        projector=default_projector))
    projectiondefaults.append(ProjectionDefault(
        name='motions',
        display_name='Motions',
        projector=default_projector))
    projectiondefaults.append(ProjectionDefault(
        name='motionBlocks',
        display_name='Motion Blocks',
        projector=default_projector))
    projectiondefaults.append(ProjectionDefault(
        name='assignments',
        display_name='Elections',
        projector=default_projector))
    projectiondefaults.append(ProjectionDefault(
        name='users',
        display_name='Participants',
        projector=default_projector))
    projectiondefaults.append(ProjectionDefault(
        name='mediafiles',
        display_name='Files',
        projector=default_projector))
    projectiondefaults.append(ProjectionDefault(
        name='messages',
        display_name='Messages',
        projector=default_projector))
    projectiondefaults.append(ProjectionDefault(
        name='countdowns',
        display_name='Countdowns',
        projector=default_projector))

    # Create all new projectiondefaults
    ProjectionDefault.objects.bulk_create(projectiondefaults)


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('sessions', '0001_initial'),
        ('contenttypes', '0002_remove_content_type_name'),
        ('core', '0001_initial'),
        ('agenda', '0001_initial'),  # ('agenda', '0002_item_duration') is not required but would be also ok.
        ('topics', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Countdown',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.CharField(blank=True, max_length=256)),
                ('running', models.BooleanField(default=False)),
                ('default_time', models.PositiveIntegerField(default=60)),
                ('countdown_time', models.FloatField(default=60)),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='ProjectionDefault',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=256)),
                ('display_name', models.CharField(max_length=256)),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='ProjectorMessage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField(blank=True)),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Session',
            fields=[
                ('session_ptr', models.OneToOneField(
                    auto_created=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    parent_link=True,
                    primary_key=True,
                    serialize=False,
                    to='sessions.Session')),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'default_permissions': (),
            },
            bases=('sessions.session',),
        ),
        migrations.RunPython(
            move_custom_slides_to_topics
        ),
        migrations.RemoveField(
            model_name='customslide',
            name='attachments',
        ),
        migrations.DeleteModel(
            name='CustomSlide',
        ),
        migrations.AlterModelOptions(
            name='chatmessage',
            options={'default_permissions': (), 'permissions': (('can_use_chat', 'Can use the chat'), ('can_manage_chat', 'Can manage the chat'))},
        ),
        migrations.AddField(
            model_name='projector',
            name='blank',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='projector',
            name='height',
            field=models.PositiveIntegerField(default=768),
        ),
        migrations.AddField(
            model_name='projector',
            name='name',
            field=models.CharField(blank=True, max_length=255, unique=True),
        ),
        migrations.AddField(
            model_name='projector',
            name='width',
            field=models.PositiveIntegerField(default=1024),
        ),
        migrations.AddField(
            model_name='projectiondefault',
            name='projector',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='projectiondefaults', to='core.Projector'),
        ),
        migrations.RunPython(
            name_default_projector
        ),
        migrations.RunPython(
            remove_old_countdowns_messages
        ),
        migrations.RunPython(
            add_projection_defaults
        ),
    ]
