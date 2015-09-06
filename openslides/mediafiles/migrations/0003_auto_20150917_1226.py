from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('mediafiles', '0002_auto_20150906_1246'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='mediafile',
            name='filetype',
        ),
        migrations.AlterField(
            model_name='mediafile',
            name='title',
            field=models.CharField(unique=True, verbose_name='Title', max_length=255, default='', blank=True),
            preserve_default=False,
        ),
    ]
