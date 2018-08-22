from typing import Generator, Type

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


def get_projector_elements() -> Generator[Type[ProjectorElement], None, None]:
    yield AssignmentSlide
