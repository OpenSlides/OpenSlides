from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement
from .models import Assignment


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
                # Yield user instances of current candidates (i. e. future
                # poll participants) and elected persons (i. e. former poll
                # participants).
                yield user
            for poll in assignment.polls.all().prefetch_related('options'):
                # Yield user instances of the participants of all polls.
                for option in poll.options.all():
                    yield option.candidate

    def need_full_update_for_this(self, collection_element):
        # Full update if assignment changes because then we may have new
        # candidates and therefor need new users.
        return collection_element.collection_string == Assignment.get_collection_string()
