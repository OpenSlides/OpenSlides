# Required migration for the migration process in the users app.
# Django groups are dropped, and this group references needs to point
# to our replacement "NewGroup", which is later renamed to "Group"

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('motions', '0016_merge_amendment_into_final'),
        ('users', '0008_drop_django_groups'),
    ]

    operations = [
        migrations.AlterField(
            model_name='motioncommentsection',
            name='read_groups',
            field=models.ManyToManyField(
                blank=True,
                related_name='read_comments',
                to='users.NewGroup')
        ),
        migrations.AlterField(
            model_name='motioncommentsection',
            name='write_groups',
            field=models.ManyToManyField(
                blank=True,
                related_name='write_comments',
                to='users.NewGroup')
        ),
    ]
