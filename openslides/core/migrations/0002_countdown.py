from django.db import migrations


def add_default_projector_2(apps, schema_editor):
    """
    Adds default projector, activates countdown.
    """
    # We get the model from the versioned app registry;
    # if we directly import it, it will be the wrong version.
    Projector = apps.get_model('core', 'Projector')
    projector = Projector.objects.get()
    config = projector.config
    config.append({
        'name': 'core/countdown',
        'stable': True,
        'status': 'stop',
        'countdown_time': 60
    })
    projector.config = config
    projector.save()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            code=add_default_projector_2,
            reverse_code=None,
            atomic=True,
        ),
    ]
