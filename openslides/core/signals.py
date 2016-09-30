from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.dispatch import Signal

from .models import ProjectionDefault, Projector

# This signal is sent when the migrate command is done. That means it is sent
# after post_migrate sending and creating all Permission objects. Don't use it
# for other things than dealing with Permission objects.
post_permission_creation = Signal()


def delete_django_app_permissions(sender, **kwargs):
    """
    Deletes the permissions, Django creates by default. Only required
    for auth, contenttypes and sessions.
    """
    contenttypes = ContentType.objects.filter(
        Q(app_label='auth') |
        Q(app_label='contenttypes') |
        Q(app_label='sessions'))
    Permission.objects.filter(content_type__in=contenttypes).delete()


def create_builtin_projection_defaults(**kwargs):
    """
    Creates the builtin defaults:
     - agenda_all_items, agenda_list_of_speakers, agenda_current_list_of_speakers
     - topics
     - assignments
     - mediafiles
     - motion
     - users

    These strings have to be used in the controllers where you want to
    define a projector button. Use the string to get the id of the
    responsible projector and pass this id to the projector button directive.
    """
    # Check whether ProjectionDefault objects exist.
    if ProjectionDefault.objects.all().exists():
        # Do completely nothing if some defaults are already in the database.
        return

    default_projector = Projector.objects.get(pk=1)

    ProjectionDefault.objects.create(
        name='agenda_all_items',
        display_name='Agenda',
        projector=default_projector)
    ProjectionDefault.objects.create(
        name='topics',
        display_name='Topics',
        projector=default_projector)
    ProjectionDefault.objects.create(
        name='agenda_list_of_speakers',
        display_name='List of speakers',
        projector=default_projector)
    ProjectionDefault.objects.create(
        name='agenda_current_list_of_speakers',
        display_name='Current list of speakers',
        projector=default_projector)
    ProjectionDefault.objects.create(
        name='motions',
        display_name='Motions',
        projector=default_projector)
    ProjectionDefault.objects.create(
        name='assignments',
        display_name='Elections',
        projector=default_projector)
    ProjectionDefault.objects.create(
        name='users',
        display_name='Participants',
        projector=default_projector)
    ProjectionDefault.objects.create(
        name='mediafiles',
        display_name='Files',
        projector=default_projector)
