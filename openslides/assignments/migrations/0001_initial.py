from django.conf import settings
from django.db import migrations, models

import openslides.utils.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Assignment',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('title', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('open_posts', models.PositiveSmallIntegerField()),
                ('poll_description_default', models.CharField(blank=True, max_length=79)),
                ('phase', models.IntegerField(choices=[(0, 'Searching for candidates'), (1, 'Voting'), (2, 'Finished')], default=0)),
            ],
            options={
                'permissions': (
                    ('can_see', 'Can see elections'), ('can_nominate_other', 'Can nominate another participant'),
                    ('can_nominate_self', 'Can nominate oneself'), ('can_manage', 'Can manage elections')),
                'verbose_name': 'Election',
                'ordering': ('title',),
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='AssignmentOption',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('candidate', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='AssignmentPoll',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('votesvalid', openslides.utils.models.MinMaxIntegerField(null=True, blank=True)),
                ('votesinvalid', openslides.utils.models.MinMaxIntegerField(null=True, blank=True)),
                ('votescast', openslides.utils.models.MinMaxIntegerField(null=True, blank=True)),
                ('published', models.BooleanField(default=False)),
                ('yesnoabstain', models.BooleanField(default=False)),
                ('description', models.CharField(blank=True, max_length=79)),
                ('assignment', models.ForeignKey(related_name='polls', to='assignments.Assignment')),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='AssignmentRelatedUser',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('elected', models.BooleanField(default=False)),
                ('assignment', models.ForeignKey(related_name='assignment_related_users', to='assignments.Assignment')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.CreateModel(
            name='AssignmentVote',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('weight', models.IntegerField(null=True, default=1)),
                ('value', models.CharField(null=True, max_length=255)),
                ('option', models.ForeignKey(related_name='votes', to='assignments.AssignmentOption')),
            ],
            options={
                'default_permissions': (),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.AddField(
            model_name='assignmentoption',
            name='poll',
            field=models.ForeignKey(related_name='options', to='assignments.AssignmentPoll'),
        ),
        migrations.AddField(
            model_name='assignment',
            name='related_users',
            field=models.ManyToManyField(to=settings.AUTH_USER_MODEL, through='assignments.AssignmentRelatedUser'),
        ),
        migrations.AddField(
            model_name='assignment',
            name='tags',
            field=models.ManyToManyField(blank=True, to='core.Tag'),
        ),
        migrations.AlterUniqueTogether(
            name='assignmentrelateduser',
            unique_together=set([('assignment', 'user')]),
        ),
    ]
