from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement, ProjectorRequirement
from .models import Mediafile
from .views import MediafileViewSet


class MediafileSlide(ProjectorElement):
    """
    Slide definitions for Mediafile model.
    """
    name = 'mediafiles/mediafile'

    def check_data(self):
        if not Mediafile.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('File does not exist.')

    def get_requirements(self, config_entry):
        pk = config_entry.get('id')
        if pk is not None:
            yield ProjectorRequirement(
                view_class=MediafileViewSet,
                view_action='retrieve',
                pk=str(pk))
