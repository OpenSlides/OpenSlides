from ..core.config import config
from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement
from .models import Topic


class TopicSlide(ProjectorElement):
    """
    Slide definitions for topic model.
    """
    name = 'topics/topic'

    def check_data(self):
        if not Topic.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('Topic does not exist.')

    def get_requirements(self, config_entry):
        try:
            topic = Topic.objects.get(pk=config_entry.get('id'))
        except Topic.DoesNotExist:
            # Topic does not exist. Just do nothing.
            pass
        else:
            yield topic
            yield topic.agenda_item
            for speaker in topic.agenda_item.speakers.filter(end_time=None):
                yield speaker.user
            query = (topic.agenda_item.speakers.exclude(end_time=None)
                     .order_by('-end_time')[:config['agenda_show_last_speakers']])
            for speaker in query:
                yield speaker.user
