from openslides.core.exceptions import ProjectorException
from openslides.core.views import TagViewSet
from openslides.utils.projector import ProjectorElement, ProjectorRequirement

from .models import Assignment, AssignmentPoll
from .views import AssignmentViewSet


class AssignmentSlide(ProjectorElement):
    """
    Slide definitions for Assignment model.

    Set 'id' to get a detail slide. Omit it to get a list slide.
    """
    name = 'assignments/assignment'

    def check_data(self):
        pk = self.config_entry.get('id')
        if pk is not None:
            # Detail slide.
            if not Assignment.objects.filter(pk=pk).exists():
                raise ProjectorException('Election does not exist.')
            poll_id = self.config_entry.get('poll')
            if poll_id is not None:
                # Poll slide.
                if not AssignmentPoll.objects.filter(pk=poll_id).exists():
                    raise ProjectorException('Poll does not exist.')

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is None:
            # List slide. Related objects like users and tags are not unlocked.
            yield ProjectorRequirement(
                view_class=AssignmentViewSet,
                view_action='list')
        else:
            # Detail slide.
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
                for poll in assignment.polls.all().prefetch_related('options'):
                    for option in poll.options.all():
                        yield ProjectorRequirement(
                            view_class=option.candidate.get_view_class(),
                            view_action='retrieve',
                            pk=str(option.candidate_id))
                for tag in assignment.tags.all():
                    yield ProjectorRequirement(
                        view_class=TagViewSet,
                        view_action='retrieve',
                        pk=str(tag.pk))
