from django.utils.translation import ugettext as _

from openslides.core.exceptions import ProjectorException
from openslides.core.views import TagViewSet
from openslides.utils.projector import ProjectorElement, ProjectorRequirement

from .models import Item
from .views import ItemViewSet


class ItemListSlide(ProjectorElement):
    """
    Slide definitions for the agenda.
    """
    name = 'agenda/agenda'

    def get_requirements(self, config_entry):
        yield ProjectorRequirement(
            view_class=ItemViewSet,
            view_action='list')


class ItemDetailSlide(ProjectorElement):
    """
    Slide definitions for Item model.

    To activate this slide as list of speakers slide, set 'list_of_speakers'
    true.
    """
    name = 'agenda/item'

    def get_context(self):
        pk = self.config_entry.get('id')
        if not Item.objects.filter(pk=pk).exists():
            raise ProjectorException(_('Item does not exist.'))
        return {'id': pk, 'list_of_speakers': self.config_entry.get('list_of_speakers', False)}

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is not None:
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
