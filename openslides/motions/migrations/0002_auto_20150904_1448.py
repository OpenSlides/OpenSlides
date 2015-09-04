from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('motions', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='motion',
            name='attachments',
            field=models.ManyToManyField(blank=True, to='mediafiles.Mediafile'),
        ),
        migrations.AlterField(
            model_name='motion',
            name='submitters',
            field=models.ManyToManyField(blank=True, related_name='motion_submitters', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='motion',
            name='supporters',
            field=models.ManyToManyField(blank=True, related_name='motion_supporters', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='motion',
            name='tags',
            field=models.ManyToManyField(blank=True, to='core.Tag'),
        ),
    ]
