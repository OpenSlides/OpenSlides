from typing import Generator, Type

from ..core.exceptions import ProjectorException
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


class ListOfSpeakersSlide(ProjectorElement):
    """
    Slide definitions for Item model.
    This is only for list of speakers slide. You have to set 'id'.
    """
    name = 'agenda/list-of-speakers'

    def check_data(self):
        if not Item.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('Item does not exist.')

    def update_data(self):
        return {'agenda_item_id': self.config_entry.get('id')}


class CurrentListOfSpeakersSlide(ProjectorElement):
    """
    Slide for the current list of speakers.
    """
    name = 'agenda/current-list-of-speakers'


def get_projector_elements() -> Generator[Type[ProjectorElement], None, None]:
    yield ItemListSlide
    yield ListOfSpeakersSlide
    yield CurrentListOfSpeakersSlide
