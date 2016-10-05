from ..core.config import config
from ..core.exceptions import ProjectorException
from ..core.models import Projector
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

    def update_data(self):
        return {'agenda_item_id': self.config_entry.get('id')}


class CurrentListOfSpeakersMetaClass(ProjectorElement):
    """
    Main class for the list of speaker slides.

    """
    def get_requirements(self, config_entry):
        items = self.get_agenda_items(config['projector_currentListOfSpeakers_reference'])
        for item in items:
            yield item
            for speaker in item.speakers.filter(end_time=None):
                yield speaker.user
            query = (item.speakers.exclude(end_time=None)
                     .order_by('-end_time')[:config['agenda_show_last_speakers']])
            for speaker in query:
                # Yield last speakers
                yield speaker.user

    def get_agenda_items(self, projector_id):
        projector = Projector.objects.get(pk=projector_id)
        for element in projector.elements.values():
            agenda_item_id = element.get('agenda_item_id')
            if agenda_item_id is not None:
                yield Item.objects.get(pk=agenda_item_id)

    def get_collection_elements_required_for_this(self, collection_element, config_entry):
        output = super().get_collection_elements_required_for_this(collection_element, config_entry)
        # Full update if agenda_item changes because then we may have new
        # candidates and therefor need new users.
        items = self.get_agenda_items(config['projector_currentListOfSpeakers_reference'])
        for item in items:
            if collection_element == CollectionElement.from_values(item.get_collection_string(), item.pk):
                output.extend(self.get_requirements_as_collection_elements(config_entry))
                break
        return output


class CurrentListOfSpeakersSlide(CurrentListOfSpeakersMetaClass):
    """
    Slide for the current list of speakers.
    """
    name = 'agenda/current-list-of-speakers'


class CurrentListOfSpeakersOverlaySlide(CurrentListOfSpeakersMetaClass):
    """
    List of speakers overlay.
    Subclass of ListOfSpeakers
    """
    name = 'agenda/current-list-of-speakers-overlay'
