from django.db import migrations, models

import openslides.utils.models


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0006_require_contenttypes_0002'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.AutoField(verbose_name='ID', primary_key=True, serialize=False, auto_created=True)),
                ('password', models.CharField(verbose_name='password', max_length=128)),
                ('last_login', models.DateTimeField(verbose_name='last login', null=True, blank=True)),
                ('is_superuser', models.BooleanField(
                    help_text='Designates that this user has all permissions without explicitly assigning them.',
                    verbose_name='superuser status', default=False)),
                ('username', models.CharField(max_length=255, blank=True, unique=True)),
                ('first_name', models.CharField(max_length=255, blank=True)),
                ('last_name', models.CharField(max_length=255, blank=True)),
                ('structure_level', models.CharField(blank=True, max_length=255, default='')),
                ('title', models.CharField(blank=True, max_length=50, default='')),
                ('about_me', models.TextField(blank=True, default='')),
                ('comment', models.TextField(blank=True, default='')),
                ('default_password', models.CharField(blank=True, max_length=100, default='')),
                ('is_active', models.BooleanField(default=True)),
                ('is_present', models.BooleanField(default=False)),
                ('groups', models.ManyToManyField(
                    related_name='user_set',
                    help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
                    verbose_name='groups', blank=True, to='auth.Group', related_query_name='user')),
                ('user_permissions', models.ManyToManyField(
                    related_name='user_set', help_text='Specific permissions for this user.', verbose_name='user permissions',
                    blank=True, to='auth.Permission', related_query_name='user')),
            ],
            options={
                'permissions': (
                    ('can_see_name', 'Can see names of users'), ('can_see_extra_data', 'Can see extra data of users'),
                    ('can_manage', 'Can manage users')),
                'ordering': ('last_name', 'first_name', 'username'),
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
    ]
