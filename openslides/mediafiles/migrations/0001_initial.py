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
                ('id', models.AutoField(primary_key=True, serialize=False, verbose_name='ID', auto_created=True)),
                ('mediafile', models.FileField(upload_to='file', verbose_name='File')),
                ('title', models.CharField(unique=True, verbose_name='Title', max_length=255)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('filetype', models.CharField(editable=False, max_length=255)),
                ('is_presentable', models.BooleanField(
                    default=False,
                    help_text='If checked, this file can be presented on the projector. '
                              'Currently, this is only possible for PDFs.',
                    verbose_name='Is Presentable')),
                ('uploader', models.ForeignKey(to=settings.AUTH_USER_MODEL, blank=True, verbose_name='Uploaded by', null=True)),
            ],
            options={
                'permissions': (
                    ('can_see', 'Can see the list of files'),
                    ('can_upload', 'Can upload files'),
                    ('can_manage', 'Can manage files')),
                'ordering': ['title'],
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
    ]
