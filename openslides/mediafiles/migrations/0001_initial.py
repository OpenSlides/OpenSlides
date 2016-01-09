import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import openslides.utils.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Mediafile',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('mediafile', models.FileField(upload_to='file')),
                ('title', models.CharField(blank=True, unique=True, max_length=255)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('uploader', models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, null=True, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'permissions': (
                    ('can_see', 'Can see the list of files'), ('can_upload', 'Can upload files'), ('can_manage', 'Can manage files')),
                'default_permissions': (),
                'ordering': ['title'],
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
    ]
