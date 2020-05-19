from django.db import migrations


def remove_deprecated_slides(apps, schema_editor):
    Projector = apps.get_model("core", "Projector")
    for projector in Projector.objects.all():
        new_history = []
        for entry in projector.elements_history:
            new_entry = []
            for subentry in entry:
                if subentry["name"] != "assignments/poll":
                    new_entry.append(subentry)
            if len(new_entry):
                new_history.append(new_entry)
        projector.elements_history = new_history
        projector.save(skip_autoupdate=True)


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0013_rename_verbose_poll_types"),
    ]

    operations = [
        migrations.RunPython(remove_deprecated_slides),
    ]
