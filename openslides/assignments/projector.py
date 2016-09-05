from ..agenda.access_permissions import ItemAccessPermissions
from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement, ProjectorRequirement
from .access_permissions import AssignmentAccessPermissions
from .models import Assignment, AssignmentPoll


class AssignmentSlide(ProjectorElement):
    """
    Slide definitions for Assignment model.

    Set 'id' to get a detail slide. Omit it to get a list slide. Set
    'poll' to get a poll slide.
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
            # List slide. Related objects like users are not unlocked.
            yield ProjectorRequirement(
                access_permissions=AssignmentAccessPermissions)
        else:
            # Detail slide.
            try:
                assignment = Assignment.objects.get(pk=pk)
            except Assignment.DoesNotExist:
                # Assignment does not exist. Just do nothing.
                pass
            else:
                # Assignment and agenda item
                yield ProjectorRequirement(
                    access_permissions=AssignmentAccessPermissions,
                    id=str(pk))
                yield ProjectorRequirement(
                    access_permissions=ItemAccessPermissions,
                    id=str(assignment.agenda_item_id))

                # Candidates and elected users (related users)
                # TODO: Remove related users on assignment poll slide if not required.
                for user in assignment.related_users.all():
                    yield ProjectorRequirement(
                        access_permissions=user.get_access_permissions(),
                        id=str(user.pk))

                # Users in polls (poll options)
                for poll in assignment.polls.all().prefetch_related('options'):
                    for option in poll.options.all():
                        yield ProjectorRequirement(
                            access_permissions=option.candidate.get_access_permissions(),
                            id=str(option.candidate_id))

                # Hint: We do not have to yield any ProjectorRequirement
                # instances for tags because tags are always available for
                # everyone.
