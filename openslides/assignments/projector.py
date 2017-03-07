from ..core.exceptions import ProjectorException
from ..utils.collection import CollectionElement
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

    def get_collection_elements_required_for_this(self, collection_element, config_entry):
        output = super().get_collection_elements_required_for_this(collection_element, config_entry)
        # Full update if assignment changes because then we may have new
        # candidates and therefor need new users.
        if collection_element == CollectionElement.from_values(Assignment.get_collection_string(), config_entry.get('id')):
            output.extend(self.get_requirements_as_collection_elements(config_entry))
        return output

    def update_data(self):
        data = None
        try:
            assignment = Assignment.objects.get(pk=self.config_entry.get('id'))
        except Assignment.DoesNotExist:
            # Assignment does not exist, so just do nothing.
            pass
        else:
            data = {'agenda_item_id': assignment.agenda_item_id}
        return data
