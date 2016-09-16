from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement, ProjectorRequirement
from .access_permissions import ItemAccessPermissions
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
        # TODO: Do not unlock hidden items.
        yield ProjectorRequirement(
            access_permissions=ItemAccessPermissions)


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
            try:
                item = Item.objects.get(pk=pk)
            except Item.DoesNotExist:
                # Item does not exist. Just do nothing.
                pass
            else:
                # Item
                yield ProjectorRequirement(
                    access_permissions=ItemAccessPermissions,
                    id=str(pk))

                # Speakers (users)
                for speaker in item.speakers.all().select_related('user'):
                    yield ProjectorRequirement(
                        access_permissions=speaker.user.get_access_permissions(),
                        id=str(speaker.user.pk))
