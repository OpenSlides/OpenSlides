from ..core.config import config
from ..core.exceptions import ProjectorException
from ..utils.collection import CollectionElement
from ..utils.projector import ProjectorElement
from .models import Item


class ItemListSlide(ProjectorElement):
    """
    Slide definitions for Item model.

    This is only for item list slides.

    Set 'id' to None to get a list slide of all root items. Set 'id' to an
    integer to get a list slide of the children of the metioned item.

    Additionally set 'tree' to True to get also children of children.
    """
    name = 'agenda/item-list'

    def check_data(self):
        pk = self.config_entry.get('id')
        if pk is not None:
            # Children slide.
            if not Item.objects.filter(pk=pk).exists():
                raise ProjectorException('Item does not exist.')

    def get_requirements(self, config_entry):
        yield from Item.objects.all()


class ListOfSpeakersSlide(ProjectorElement):
    """
    Slide definitions for Item model.

    This is only for list of speakers slide. You have to set 'id'.
    """
    name = 'agenda/list-of-speakers'

    def check_data(self):
        if not Item.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('Item does not exist.')

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is not None:
            # List of speakers slide.
            try:
                item = Item.objects.get(pk=pk)
            except Item.DoesNotExist:
                # Item does not exist. Just do nothing.
                pass
            else:
                yield item
                for speaker in item.speakers.filter(end_time=None):
                    # Yield current speaker and next speakers
                    yield speaker.user
                query = (item.speakers.exclude(end_time=None)
                         .order_by('-end_time')[:config['agenda_show_last_speakers']])
                for speaker in query:
                    # Yield last speakers
                    yield speaker.user

    def get_collection_elements_required_for_this(self, collection_element, config_entry):
        output = super().get_collection_elements_required_for_this(collection_element, config_entry)
        # Full update if item changes because then we may have new
        # candidates and therefor need new users.
        if collection_element == CollectionElement.from_values(Item.get_collection_string(), config_entry.get('id')):
            output.extend(self.get_requirements_as_collection_elements(config_entry))
        return output


class CurrentListOfSpeakersSlide(ProjectorElement):
    """
    Slide for the current list of speakers.

    Nothing special to check.
    """
    name = 'agenda/current-list-of-speakers'

    def get_requirements(self, config_entry):
        pk = config['projector_currentListOfSpeakers_reference']
        if pk is not None:
            # List of speakers slide.
            try:
                item = Item.objects.get(pk=pk)
            except Item.DoesNotExist:
                # Item does not exist. Just do nothing.
                pass
            else:
                yield item
                for speaker in item.speakers.filter(end_time=None):
                    # Yield current speaker and next speakers
                    yield speaker.user
                query = (item.speakers.exclude(end_time=None)
                         .order_by('-end_time')[:config['agenda_show_last_speakers']])
                for speaker in query:
                    # Yield last speakers
                    yield speaker.user
