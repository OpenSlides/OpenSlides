import django.utils.timezone
from django.db import migrations, models

import openslides.utils.models


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.AutoField(serialize=False, auto_created=True, primary_key=True, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(default=django.utils.timezone.now, verbose_name='last login')),
                ('is_superuser', models.BooleanField(
                    default=False,
                    verbose_name='superuser status',
                    help_text='Designates that this user has all permissions without explicitly assigning them.')),
                ('username', models.CharField(max_length=255, blank=True, verbose_name='Username', unique=True)),
                ('first_name', models.CharField(max_length=255, blank=True, verbose_name='First name')),
                ('last_name', models.CharField(max_length=255, blank=True, verbose_name='Last name')),
                ('structure_level', models.CharField(
                    default='',
                    max_length=255,
                    blank=True,
                    verbose_name='Structure level',
                    help_text='Will be shown after the name.')),
                ('title', models.CharField(
                    default='',
                    max_length=50,
                    blank=True,
                    verbose_name='Title',
                    help_text='Will be shown before the name.')),
                ('about_me', models.TextField(default='', blank=True, verbose_name='About me', help_text='Your profile text')),
                ('comment', models.TextField(default='', blank=True, verbose_name='Comment', help_text='Only for notes.')),
                ('default_password', models.CharField(default='', max_length=100, blank=True, verbose_name='Default password')),
                ('is_active', models.BooleanField(
                    default=True,
                    verbose_name='active',
                    help_text='Designates whether this user should be treated as '
                              'active. Unselect this instead of deleting accounts.')),
                ('is_present', models.BooleanField(
                    default=False,
                    verbose_name='present',
                    help_text='Designates whether this user is in the room or not.')),
                ('groups', models.ManyToManyField(
                    blank=True,
                    verbose_name='groups',
                    related_query_name='user',
                    related_name='user_set',
                    to='auth.Group',
                    help_text='The groups this user belongs to. A user will get '
                              'all permissions granted to each of his/her group.')),
                ('user_permissions', models.ManyToManyField(
                    blank=True,
                    verbose_name='user permissions',
                    related_query_name='user',
                    related_name='user_set',
                    to='auth.Permission',
                    help_text='Specific permissions for this user.')),
            ],
            options={
                'permissions': (
                    ('can_see_name', 'Can see names of users'),
                    ('can_see_extra_data', 'Can see extra data of users'),
                    ('can_manage', 'Can manage users')),
                'ordering': ('last_name',),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
    ]
