from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement
from .models import Assignment, AssignmentPoll


class AssignmentSlide(ProjectorElement):
    """
    Slide definitions for Assignment model.

    You can send a poll id to get a poll slide.
    """
    name = 'assignments/assignment'

    def check_data(self):
        if not Assignment.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('Election does not exist.')
        poll_id = self.config_entry.get('poll')
        if poll_id:
            # Poll slide.
            try:
                poll = AssignmentPoll.objects.get(pk=poll_id)
            except AssignmentPoll.DoesNotExist:
                raise ProjectorException('Poll does not exist.')
            if poll.assignment_id != self.config_entry.get('id'):
                raise ProjectorException('Assignment id and poll do not belong together.')

    def get_requirements(self, config_entry):
        try:
            assignment = Assignment.objects.get(pk=config_entry.get('id'))
        except Assignment.DoesNotExist:
            # Assignment does not exist. Just do nothing.
            pass
        else:
            yield assignment
            yield assignment.agenda_item
            if not config_entry.get('poll'):
                # Assignment detail slide. Yield user instances of current
                # candidates (i. e. future poll participants) and elected
                # persons (i. e. former poll participants).
                for user in assignment.related_users.all():
                    yield user
            else:
                # Assignment poll slide. Yield user instances of the
                # participants of all polls.
                for poll in assignment.polls.all().prefetch_related('options'):
                    for option in poll.options.all():
                        yield option.candidate

    def need_full_update_for_this(self, collection_element):
        # Full update if assignment changes because then we may have new
        # candidates and therefor need new users.
        return collection_element.collection_string == Assignment.get_collection_string()
