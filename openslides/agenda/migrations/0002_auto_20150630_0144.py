from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agenda', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='item',
            name='type',
            field=models.IntegerField(verbose_name='Type', choices=[(1, 'Agenda item'), (2, 'Organizational item')], default=1),
        ),
    ]
