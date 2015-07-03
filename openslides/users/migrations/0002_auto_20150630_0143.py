from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='groups',
            field=models.ManyToManyField(
                verbose_name='groups',
                related_query_name='user',
                to='auth.Group',
                related_name='user_set',
                help_text='The groups this user belongs to. A user will get all '
                          'permissions granted to each of their groups.',
                blank=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='last_login',
            field=models.DateTimeField(verbose_name='last login', blank=True, null=True),
        ),
    ]
