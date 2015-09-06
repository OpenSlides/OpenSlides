from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mediafiles', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='mediafile',
            name='is_presentable',
        ),
        migrations.AlterField(
            model_name='mediafile',
            name='title',
            field=models.CharField(max_length=255, null=True, unique=True, blank=True, verbose_name='Title'),
        ),
    ]
