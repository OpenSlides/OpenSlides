from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_auto_20150630_0143'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='user',
            options={
                'ordering': ('last_name', 'first_name', 'username'),
                'permissions': (
                    ('can_see_name', 'Can see names of users'),
                    ('can_see_extra_data', 'Can see extra data of users'),
                    ('can_manage', 'Can manage users'))},
        ),
        migrations.AlterField(
            model_name='user',
            name='about_me',
            field=models.TextField(blank=True, help_text='Profile text.', default='', verbose_name='About me'),
        ),
        migrations.AlterField(
            model_name='user',
            name='is_active',
            field=models.BooleanField(
                help_text='Designates whether this user should be treated as active. Unselect this instead of deleting the account.',
                default=True,
                verbose_name='Active'),
        ),
        migrations.AlterField(
            model_name='user',
            name='is_present',
            field=models.BooleanField(help_text='Designates whether this user is in the room or not.', default=False, verbose_name='Present'),
        ),
    ]
