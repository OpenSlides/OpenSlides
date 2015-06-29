from django.conf import settings
from django.db import migrations, models

import openslides.utils.models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Assignment',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('title', models.CharField(max_length=100, verbose_name='Title')),
                ('description', models.TextField(blank=True, verbose_name='Description')),
                ('open_posts', models.PositiveSmallIntegerField(verbose_name='Number of members to be elected')),
                ('poll_description_default', models.CharField(
                    blank=True,
                    max_length=79,
                    verbose_name='Default comment on the ballot paper')),
                ('phase', models.IntegerField(
                    default=0,
                    choices=[(0, 'Searching for candidates'), (1, 'Voting'), (2, 'Finished')])),
            ],
            options={
                'verbose_name': 'Election',
                'permissions': (
                    ('can_see', 'Can see elections'),
                    ('can_nominate_other', 'Can nominate another participant'),
                    ('can_nominate_self', 'Can nominate oneself'),
                    ('can_manage', 'Can manage elections')),
                'ordering': ('title',),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='AssignmentOption',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('candidate', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='AssignmentPoll',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('votesvalid', openslides.utils.models.MinMaxIntegerField(null=True, blank=True, verbose_name='Valid votes')),
                ('votesinvalid', openslides.utils.models.MinMaxIntegerField(
                    null=True,
                    blank=True,
                    verbose_name='Invalid votes')),
                ('votescast', openslides.utils.models.MinMaxIntegerField(null=True, blank=True, verbose_name='Votes cast')),
                ('published', models.BooleanField(default=False)),
                ('yesnoabstain', models.BooleanField(default=False)),
                ('description', models.CharField(blank=True, max_length=79, verbose_name='Comment on the ballot paper')),
                ('assignment', models.ForeignKey(related_name='polls', to='assignments.Assignment')),
            ],
            options={
                'abstract': False,
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='AssignmentRelatedUser',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('status', models.IntegerField(default=1, choices=[(1, 'candidate'), (2, 'elected'), (3, 'blocked')])),
                ('assignment', models.ForeignKey(related_name='assignment_related_users', to='assignments.Assignment')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='AssignmentVote',
            fields=[
                ('id', models.AutoField(serialize=False, primary_key=True, auto_created=True, verbose_name='ID')),
                ('weight', models.IntegerField(null=True, default=1)),
                ('value', models.CharField(null=True, max_length=255)),
                ('option', models.ForeignKey(to='assignments.AssignmentOption')),
            ],
            options={
                'abstract': False,
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.AlterUniqueTogether(
            name='assignmentrelateduser',
            unique_together=set([('assignment', 'user')]),
        ),
        migrations.AddField(
            model_name='assignmentoption',
            name='poll',
            field=models.ForeignKey(to='assignments.AssignmentPoll'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='assignment',
            name='related_users',
            field=models.ManyToManyField(through='assignments.AssignmentRelatedUser', to=settings.AUTH_USER_MODEL),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='assignment',
            name='tags',
            field=models.ManyToManyField(blank=True, to='core.Tag'),
            preserve_default=True,
        ),
    ]
