from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("motions", "0044_motionpoll_fix_vote_values")]

    operations = [
        migrations.AddField(
            model_name="motion",
            name="start_line_number",
            field=models.IntegerField(default=1),
        )
    ]
