from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('motions', '0002_auto_20150904_1448'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='motionpoll',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='motionpoll',
            name='poll_number',
        ),
    ]
