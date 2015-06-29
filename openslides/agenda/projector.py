from django.utils.translation import ugettext as _

from openslides.core.exceptions import ProjectorException
from openslides.core.views import TagViewSet
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

    def get_context(self):
        pk = self.config_entry.get('id')
        if pk is None:
            # Root list slide.
            context = {'tree':  self.config_entry.get('tree', False)}
        else:
            # Children slide.
            if not Item.objects.filter(pk=pk).exists():
                raise ProjectorException(_('Item does not exist.'))
            context = {'id': pk, 'tree':  self.config_entry.get('tree', False)}
        return context

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


class ItemDetailSlide(ProjectorElement):
    """
    Slide definitions for Item model.

    This is only for detail slides. You have to set 'id'.

    To activate a detail slide as list of speakers slide, set 'id' and set
    'list_of_speakers' true.
    """
    name = 'agenda/item'

    def get_context(self):
        pk = self.config_entry.get('id')
        if pk is None:
            raise ProjectorException(_('Id must not be None.'))
        if not Item.objects.filter(pk=pk).exists():
            raise ProjectorException(_('Item does not exist.'))
        return {'id': pk, 'list_of_speakers': self.config_entry.get('list_of_speakers', False)}

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is not None:
            # Detail slide.
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
                for speaker in item.speaker_set.all():
                    yield ProjectorRequirement(
                        view_class=speaker.user.get_view_class(),
                        view_action='retrieve',
                        pk=str(speaker.user_id))
                for tag in item.tags.all():
                    yield ProjectorRequirement(
                        view_class=TagViewSet,
                        view_action='retrieve',
                        pk=str(tag.pk))
