from openslides.core.exceptions import ProjectorException
from openslides.utils.projector import ProjectorElement, ProjectorRequirement

from .models import Item
from .views import ItemViewSet


class ItemListSlide(ProjectorElement):
    """
    Slide definitions for Item model.

    This is only for list slides.

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
        pk = config_entry.get('id', 'tree')
        if pk is None or config_entry.get('tree', False):
            # Root list slide or slide with tree.
            yield ProjectorRequirement(
                view_class=ItemViewSet,
                view_action='tree')

        # Root list slide and children list slide.
        # Related objects like users and tags are not unlocked.
        yield ProjectorRequirement(
            view_class=ItemViewSet,
            view_action='list')


class ListOfSpeakersSlide(ProjectorElement):
    """
    Slide definitions for Item model.

    This is only for list of speakers slide. You have to set 'id'.
    """
    name = 'agenda/list-of-speakers'

    def check_data(self):
        pk = self.config_entry.get('id')
        if pk is None:
            raise ProjectorException('Id must not be None.')
        if not Item.objects.filter(pk=pk).exists():
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
                yield ProjectorRequirement(
                    view_class=ItemViewSet,
                    view_action='retrieve',
                    pk=str(item.pk))
                for speaker in item.speakers.all():
                    yield ProjectorRequirement(
                        view_class=speaker.user.get_view_class(),
                        view_action='retrieve',
                        pk=str(speaker.user_id))
