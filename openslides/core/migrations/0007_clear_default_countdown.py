import uuid

from django.db import migrations


def clear_all_and_make_it_new_2(apps, schema_editor):
    """
    Clear all projector elements and them write new.
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
    projector.save()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_auto_20150914_2232'),
    ]

    operations = [
        migrations.RunPython(
            code=clear_all_and_make_it_new_2,
            reverse_code=None,
            atomic=True,
        ),
    ]
