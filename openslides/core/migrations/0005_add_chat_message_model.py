from django.conf import settings
from django.db import migrations, models

import openslides.utils.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0004_clear_all_and_make_it_new'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True, serialize=False)),
                ('message', models.TextField(verbose_name='Message')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(verbose_name='User', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'permissions': (('can_use_chat', 'Can use the chat'),),
            },
            bases=(openslides.utils.models.RESTModelMixin, models.Model),
        ),
        migrations.AlterModelOptions(
            name='projector',
            options={'permissions': (
                ('can_see_projector', 'Can see the projector'),
                ('can_manage_projector', 'Can manage the projector'),
                ('can_see_dashboard', 'Can see the dashboard'))},
        ),
    ]
