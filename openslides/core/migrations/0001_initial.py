import jsonfield.fields
from django.db import migrations, models

import openslides.utils.models
import openslides.utils.rest_api


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
        {'name': 'core/clock'},
        {'name': 'core/customslide', 'id': custom_slide.id}]
    Projector.objects.create(config=projector_config)


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='CustomSlide',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('title', models.CharField(verbose_name='Title', max_length=256)),
                ('text', models.TextField(verbose_name='Text', blank=True)),
                ('weight', models.IntegerField(verbose_name='Weight', default=0)),
            ],
            options={
                'ordering': ('weight', 'title'),
            },
            bases=(openslides.utils.rest_api.RESTModelMixin, openslides.utils.models.AbsoluteUrlMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Projector',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('config', jsonfield.fields.JSONField()),
            ],
            options={
                'permissions': (
                    ('can_see_projector', 'Can see the projector'),
                    ('can_manage_projector', 'Can manage the projector'),
                    ('can_see_dashboard', 'Can see the dashboard'),
                    ('can_use_chat', 'Can use the chat')),
            },
            bases=(openslides.utils.rest_api.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('name', models.CharField(verbose_name='Tag', unique=True, max_length=255)),
            ],
            options={
                'permissions': (('can_manage_tags', 'Can manage tags'),),
                'ordering': ('name',),
            },
            bases=(openslides.utils.rest_api.RESTModelMixin, openslides.utils.models.AbsoluteUrlMixin, models.Model),
        ),
        migrations.RunPython(
            add_default_projector,
        ),
    ]
