from ..core.exceptions import ProjectorException
from ..core.views import TagViewSet
from ..utils.projector import ProjectorElement, ProjectorRequirement
from .models import Assignment, AssignmentPoll
from .views import AssignmentViewSet


class AssignmentSlide(ProjectorElement):
    """
    Slide definitions for Assignment model.
    """
    name = 'assignments/assignment'

    def check_data(self):
        if not Assignment.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('Election does not exist.')

    def get_requirements(self, config_entry):
        try:
            assignment = Assignment.objects.get(pk=config_entry.get('id'))
        except Assignment.DoesNotExist:
            # Assignment does not exist. Just do nothing.
            pass
        else:
            yield assignment
            yield assignment.agenda_item
            for user in assignment.related_users.all():
                yield user
            for poll in assignment.polls.all().prefetch_related('options'):
                for option in poll.options.all():
                    yield option.candidate
