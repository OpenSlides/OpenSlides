import jsonfield.fields
from django.db import migrations, models

import openslides.utils.models


def add_default_projector(apps, schema_editor):
    """
    Adds default projector, welcome slide and activates clock and welcome
    slide.
    """
    # We get the model from the versioned app registry;
    # if we directly import it, it will be the wrong version.
    CustomSlide = apps.get_model('core', 'CustomSlide')
    custom_slide = CustomSlide.objects.create(
        title='Welcome to OpenSlides',
        weight=-500)
    Projector = apps.get_model('core', 'Projector')
    projector_config = [
        {'name': 'core/clock', 'stable': True},
        {'name': 'core/customslide', 'id': custom_slide.id}]
    Projector.objects.create(config=projector_config)


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='CustomSlide',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, verbose_name='ID', primary_key=True)),
                ('title', models.CharField(max_length=256, verbose_name='Title')),
                ('text', models.TextField(blank=True, verbose_name='Text')),
                ('weight', models.IntegerField(verbose_name='Weight', default=0)),
            ],
            options={
                'ordering': ('weight', 'title'),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Projector',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, verbose_name='ID', primary_key=True)),
                ('config', jsonfield.fields.JSONField()),
            ],
            options={
                'permissions': (
                    ('can_see_projector', 'Can see the projector'),
                    ('can_manage_projector', 'Can manage the projector'),
                    ('can_see_dashboard', 'Can see the dashboard'),
                    ('can_use_chat', 'Can use the chat')),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, verbose_name='ID', primary_key=True)),
                ('name', models.CharField(max_length=255, verbose_name='Tag', unique=True)),
            ],
            options={
                'ordering': ('name',),
                'permissions': (('can_manage_tags', 'Can manage tags'),),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='ConfigStore',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, verbose_name='ID', primary_key=True)),
                ('key', models.CharField(max_length=255, db_index=True, unique=True)),
                ('value', jsonfield.fields.JSONField()),
            ],
            options={
                'permissions': (('can_manage_config', 'Can manage configuration'),),
            },
            bases=(models.Model,),
        ),
        migrations.RunPython(
            code=add_default_projector,
            reverse_code=None,
            atomic=True,
        ),
    ]
