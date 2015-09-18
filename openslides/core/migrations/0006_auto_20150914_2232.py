from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_add_chat_message_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='projector',
            name='scale',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='projector',
            name='scroll',
            field=models.IntegerField(default=0),
        ),
    ]
