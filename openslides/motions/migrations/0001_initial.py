import django.db.models.deletion
import jsonfield.fields
from django.conf import settings
from django.db import migrations, models

import openslides.utils.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('mediafiles', '0001_initial'),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('prefix', models.CharField(blank=True, max_length=32)),
            ],
            options={
                'default_permissions': (),
                'ordering': ['prefix'],
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Motion',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('identifier', models.CharField(null=True, unique=True, blank=True, max_length=255)),
                ('identifier_number', models.IntegerField(null=True)),
            ],
            options={
                'permissions': (
                    ('can_see', 'Can see motions'), ('can_create', 'Can create motions'),
                    ('can_support', 'Can support motions'), ('can_manage', 'Can manage motions')),
                'verbose_name': 'Motion',
                'ordering': ('identifier',),
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='MotionLog',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('message_list', jsonfield.fields.JSONField()),
                ('time', models.DateTimeField(auto_now=True)),
                ('motion', models.ForeignKey(related_name='log_messages', to='motions.Motion')),
                ('person', models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, null=True, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'default_permissions': (),
                'ordering': ['-time'],
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='MotionOption',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='MotionPoll',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('votesvalid', openslides.utils.models.MinMaxIntegerField(null=True, blank=True)),
                ('votesinvalid', openslides.utils.models.MinMaxIntegerField(null=True, blank=True)),
                ('votescast', openslides.utils.models.MinMaxIntegerField(null=True, blank=True)),
                ('motion', models.ForeignKey(related_name='polls', to='motions.Motion')),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='MotionVersion',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('version_number', models.PositiveIntegerField(default=1)),
                ('title', models.CharField(max_length=255)),
                ('text', models.TextField()),
                ('reason', models.TextField(null=True, blank=True)),
                ('creation_time', models.DateTimeField(auto_now=True)),
                ('motion', models.ForeignKey(related_name='versions', to='motions.Motion')),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='MotionVote',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('weight', models.IntegerField(null=True, default=1)),
                ('value', models.CharField(null=True, max_length=255)),
                ('option', models.ForeignKey(to='motions.MotionOption')),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='State',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('action_word', models.CharField(max_length=255)),
                ('css_class', models.CharField(default='primary', max_length=255)),
                ('required_permission_to_see', models.CharField(blank=True, max_length=255)),
                ('allow_support', models.BooleanField(default=False)),
                ('allow_create_poll', models.BooleanField(default=False)),
                ('allow_submitter_edit', models.BooleanField(default=False)),
                ('versioning', models.BooleanField(default=False)),
                ('leave_old_version_active', models.BooleanField(default=False)),
                ('dont_set_identifier', models.BooleanField(default=False)),
                ('next_states', models.ManyToManyField(to='motions.State')),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Workflow',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('first_state', models.OneToOneField(
                    related_name='+', null=True, on_delete=django.db.models.deletion.SET_NULL, to='motions.State')),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.AddField(
            model_name='state',
            name='workflow',
            field=models.ForeignKey(related_name='states', to='motions.Workflow'),
        ),
        migrations.AddField(
            model_name='motionoption',
            name='poll',
            field=models.ForeignKey(to='motions.MotionPoll'),
        ),
        migrations.AddField(
            model_name='motion',
            name='active_version',
            field=models.ForeignKey(
                related_name='active_version', null=True, on_delete=django.db.models.deletion.SET_NULL, to='motions.MotionVersion'),
        ),
        migrations.AddField(
            model_name='motion',
            name='attachments',
            field=models.ManyToManyField(blank=True, to='mediafiles.Mediafile'),
        ),
        migrations.AddField(
            model_name='motion',
            name='category',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, null=True, to='motions.Category'),
        ),
        migrations.AddField(
            model_name='motion',
            name='parent',
            field=models.ForeignKey(
                related_name='amendments', blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='motions.Motion'),
        ),
        migrations.AddField(
            model_name='motion',
            name='state',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, null=True, to='motions.State'),
        ),
        migrations.AddField(
            model_name='motion',
            name='submitters',
            field=models.ManyToManyField(related_name='motion_submitters', blank=True, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='motion',
            name='supporters',
            field=models.ManyToManyField(related_name='motion_supporters', blank=True, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='motion',
            name='tags',
            field=models.ManyToManyField(blank=True, to='core.Tag'),
        ),
        migrations.AlterUniqueTogether(
            name='motionversion',
            unique_together=set([('motion', 'version_number')]),
        ),
    ]
