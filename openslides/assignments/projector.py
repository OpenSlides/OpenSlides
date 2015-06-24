from django.utils.translation import ugettext as _

from openslides.core.exceptions import ProjectorException
from openslides.core.views import TagViewSet
from openslides.utils.projector import ProjectorElement, ProjectorRequirement

from .models import Assignment
from .views import AssignmentViewSet


class AssignmentDetailSlide(ProjectorElement):
    """
    Slide definitions for assignment model.
    """
    name = 'assignments/assignment'

    def get_context(self):
        pk = self.config_entry.get('id')
        if not Assignment.objects.filter(pk=pk).exists():
            raise ProjectorException(_('Assignment does not exist.'))
        return {'id': pk}

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is not None:
            try:
                assignment = Assignment.objects.get(pk=pk)
            except Assignment.DoesNotExist:
                # Assignment does not exist. Just do nothing.
                pass
            else:
                yield ProjectorRequirement(
                    view_class=AssignmentViewSet,
                    view_action='retrieve',
                    pk=str(assignment.pk))
                for user in assignment.related_users.all():
                    yield ProjectorRequirement(
                        view_class=user.get_view_class(),
                        view_action='retrieve',
                        pk=str(user.pk))
                for poll in assignment.polls.all().prefetch_related('assignmentoption_set'):
                    for option in poll.assignmentoption_set.all():
                        yield ProjectorRequirement(
                            view_class=option.candidate.get_view_class(),
                            view_action='retrieve',
                            pk=str(option.candidate.pk))
                for tag in assignment.tags.all():
                    yield ProjectorRequirement(
                        view_class=TagViewSet,
                        view_action='retrieve',
                        pk=str(tag.pk))
