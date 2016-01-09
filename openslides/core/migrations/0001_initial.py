import uuid

import jsonfield.fields
from django.conf import settings
from django.db import migrations, models

import openslides.utils.models


def add_default_projector(apps, schema_editor):
    """
    Adds default projector and activates clock.
    """
    # We get the model from the versioned app registry;
    # if we directly import it, it will be the wrong version.
    Projector = apps.get_model('core', 'Projector')
    projector_config = {}
    projector_config[uuid.uuid4().hex] = {
        'name': 'core/clock',
        'stable': True}
    Projector.objects.create(config=projector_config)


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('message', models.TextField()),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'permissions': (('can_use_chat', 'Can use the chat'),),
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='ConfigStore',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('key', models.CharField(db_index=True, unique=True, max_length=255)),
                ('value', jsonfield.fields.JSONField()),
            ],
            options={
                'permissions': (('can_manage_config', 'Can manage configuration'),),
                'default_permissions': (),
            },
        ),
        migrations.CreateModel(
            name='CustomSlide',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('title', models.CharField(max_length=256)),
                ('text', models.TextField(blank=True)),
                ('weight', models.IntegerField(default=0)),
            ],
            options={
                'default_permissions': (),
                'ordering': ('weight', 'title'),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Projector',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('config', jsonfield.fields.JSONField()),
                ('scale', models.IntegerField(default=0)),
                ('scroll', models.IntegerField(default=0)),
            ],
            options={
                'permissions': (
                    ('can_see_projector', 'Can see the projector'), ('can_manage_projector', 'Can manage the projector'),
                    ('can_see_dashboard', 'Can see the dashboard')),
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('name', models.CharField(unique=True, max_length=255)),
            ],
            options={
                'permissions': (('can_manage_tags', 'Can manage tags'),),
                'default_permissions': (),
                'ordering': ('name',),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.RunPython(
            code=add_default_projector,
            reverse_code=None,
            atomic=True,
        ),
    ]
