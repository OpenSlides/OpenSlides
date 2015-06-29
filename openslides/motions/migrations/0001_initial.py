import django.db.models.deletion
import jsonfield.fields
from django.conf import settings
from django.db import migrations, models

import openslides.utils.models


class Migration(migrations.Migration):

    dependencies = [
        ('mediafiles', '__first__'),
        ('core', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('name', models.CharField(max_length=255, verbose_name='Category name')),
                ('prefix', models.CharField(blank=True, max_length=32, verbose_name='Prefix')),
            ],
            options={
                'ordering': ['prefix'],
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Motion',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('identifier', models.CharField(null=True, blank=True, max_length=255, unique=True)),
                ('identifier_number', models.IntegerField(null=True)),
            ],
            options={
                'permissions': (
                    ('can_see', 'Can see motions'),
                    ('can_create', 'Can create motions'),
                    ('can_support', 'Can support motions'),
                    ('can_manage', 'Can manage motions')),
                'ordering': ('identifier',),
                'verbose_name': 'Motion',
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='MotionLog',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('message_list', jsonfield.fields.JSONField()),
                ('time', models.DateTimeField(auto_now=True)),
                ('motion', models.ForeignKey(related_name='log_messages', to='motions.Motion')),
                ('person', models.ForeignKey(null=True, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-time'],
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='MotionOption',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
            ],
            options={
                'abstract': False,
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='MotionPoll',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('votesvalid', openslides.utils.models.MinMaxIntegerField(null=True, blank=True, verbose_name='Valid votes')),
                ('votesinvalid', openslides.utils.models.MinMaxIntegerField(
                    null=True,
                    blank=True,
                    verbose_name='Invalid votes')),
                ('votescast', openslides.utils.models.MinMaxIntegerField(null=True, blank=True, verbose_name='Votes cast')),
                ('poll_number', models.PositiveIntegerField(default=1)),
                ('motion', models.ForeignKey(related_name='polls', to='motions.Motion')),
            ],
            options={
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='MotionVersion',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('version_number', models.PositiveIntegerField(default=1)),
                ('title', models.CharField(max_length=255, verbose_name='Title')),
                ('text', models.TextField(verbose_name='Text')),
                ('reason', models.TextField(null=True, blank=True, verbose_name='Reason')),
                ('creation_time', models.DateTimeField(auto_now=True)),
                ('motion', models.ForeignKey(related_name='versions', to='motions.Motion')),
            ],
            options={
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='MotionVote',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('weight', models.IntegerField(null=True, default=1)),
                ('value', models.CharField(null=True, max_length=255)),
                ('option', models.ForeignKey(to='motions.MotionOption')),
            ],
            options={
                'abstract': False,
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='State',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('action_word', models.CharField(max_length=255)),
                ('icon', models.CharField(max_length=255)),
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
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='Workflow',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('first_state', models.OneToOneField(to='motions.State', null=True, related_name='+')),
            ],
            options={
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.AddField(
            model_name='state',
            name='workflow',
            field=models.ForeignKey(to='motions.Workflow'),
            preserve_default=True,
        ),
        migrations.AlterUniqueTogether(
            name='motionversion',
            unique_together=set([('motion', 'version_number')]),
        ),
        migrations.AlterUniqueTogether(
            name='motionpoll',
            unique_together=set([('motion', 'poll_number')]),
        ),
        migrations.AddField(
            model_name='motionoption',
            name='poll',
            field=models.ForeignKey(to='motions.MotionPoll'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='motion',
            name='active_version',
            field=models.ForeignKey(
                to='motions.MotionVersion',
                on_delete=django.db.models.deletion.SET_NULL,
                null=True,
                related_name='active_version'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='motion',
            name='attachments',
            field=models.ManyToManyField(to='mediafiles.Mediafile'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='motion',
            name='category',
            field=models.ForeignKey(to='motions.Category', null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='motion',
            name='parent',
            field=models.ForeignKey(to='motions.Motion', null=True, blank=True, related_name='amendments'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='motion',
            name='state',
            field=models.ForeignKey(null=True, to='motions.State'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='motion',
            name='submitters',
            field=models.ManyToManyField(related_name='motion_submitters', to=settings.AUTH_USER_MODEL),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='motion',
            name='supporters',
            field=models.ManyToManyField(related_name='motion_supporters', to=settings.AUTH_USER_MODEL),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='motion',
            name='tags',
            field=models.ManyToManyField(to='core.Tag'),
            preserve_default=True,
        ),
    ]
