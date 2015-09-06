import uuid

from django.db import migrations


def clear_all_and_make_it_new(apps, schema_editor):
    """
    Clear all elements and them write new.
    """
    # We get the model from the versioned app registry;
    # if we directly import it, it will be the wrong version.
    Projector = apps.get_model('core', 'Projector')
    projector = Projector.objects.get()
    projector.config = {}
    projector.config[uuid.uuid4().hex] = {
        'name': 'core/clock',
        'stable': True}
    projector.config[uuid.uuid4().hex] = {
        'name': 'core/customslide',
        'id': 1}  # TODO: Use ID from model here. Do not guess.
    projector.config[uuid.uuid4().hex] = {
        'name': 'core/countdown',
        'stable': True,
        'status': 'stop',
        'countdown_time': 60,
        'visible': False}
    projector.save()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_uuid'),
    ]

    operations = [
        migrations.RunPython(
            code=clear_all_and_make_it_new,
            reverse_code=None,
            atomic=True,
        ),
    ]
