from django.utils.translation import ugettext as _

from openslides.core.exceptions import ProjectorException
from openslides.utils.projector import ProjectorElement, ProjectorRequirement

from .models import Mediafile
from .views import MediafileViewSet


class MediafileSlide(ProjectorElement):
    """
    Slide definitions for Mediafile model.
    """
    name = 'mediafiles/mediafile'

    def get_context(self):
        pk = self.config_entry.get('id')
        try:
            mediafile = Mediafile.objects.get(pk=pk)
        except Mediafile.DoesNotExist:
            raise ProjectorException(_('File does not exist.'))
        if not (mediafile.is_presentable and mediafile.filetype == 'application/pdf'):
            raise ProjectorException(_('File is not presentable.'))
        return {'id': pk}

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is not None:
            yield ProjectorRequirement(
                view_class=MediafileViewSet,
                view_action='retrieve',
                pk=str(pk))
