from django.db import migrations


def add_amendment_projection_defaults(apps, schema_editor):
    """
    Adds projectiondefaults for messages and countdowns.
    """
    Projector = apps.get_model("core", "Projector")
    ProjectionDefault = apps.get_model("core", "ProjectionDefault")
    default_projector = Projector.objects.order_by("pk").first()

    projectiondefaults = []

    projectiondefaults.append(
        ProjectionDefault(
            name="amendments", display_name="Amendments", projector=default_projector
        )
    )

    # Create all new projectiondefaults
    ProjectionDefault.objects.bulk_create(projectiondefaults)


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0033_live_stream_permission"),
    ]

    operations = [
        migrations.RunPython(add_amendment_projection_defaults),
    ]
