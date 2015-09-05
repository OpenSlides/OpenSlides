import uuid

from django.db import migrations


def add_default_projector_3(apps, schema_editor):
    """
    Adds UUIDs to projector config.
    """
    # We get the model from the versioned app registry;
    # if we directly import it, it will be the wrong version.
    Projector = apps.get_model('core', 'Projector')
    projector = Projector.objects.get()

    def add_uuid(self):
        """
        Adds an UUID to every element.
        """
        for element in self.config:
            if element.get('uuid') is None:
                element['uuid'] = uuid.uuid4().hex

    add_uuid(projector)
    projector.save()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_countdown'),
    ]

    operations = [
        migrations.RunPython(
            code=add_default_projector_3,
            reverse_code=None,
            atomic=True,
        ),
    ]
