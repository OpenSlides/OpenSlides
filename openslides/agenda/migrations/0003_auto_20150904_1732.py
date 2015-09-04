from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('agenda', '0002_auto_20150630_0144'),
    ]

    operations = [
        migrations.AlterField(
            model_name='speaker',
            name='item',
            field=models.ForeignKey(related_name='speakers', to='agenda.Item'),
        ),
    ]
