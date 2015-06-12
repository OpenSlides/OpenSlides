from django.utils.translation import ugettext as _

from openslides.core.exceptions import ProjectorException
from openslides.utils.projector import ProjectorElement, ProjectorRequirement

from .models import User
from .views import GroupViewSet, UserViewSet


class UserSlide(ProjectorElement):
    """
    Slide definitions for user model.
    """
    name = 'users/user'
    scripts = 'users/user_slide.js'

    def get_context(self):
        pk = self.config_entry.get('id')
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            raise ProjectorException(_('User does not exist.'))
        result = [{
            'collection': 'users/user',
            'id': pk}]
        for group in user.groups.all():
            result.append({
                'collection': 'users/group',
                'id': group.pk})
        return result

    def get_requirements(self, config_entry):
        self.config_entry = config_entry
        try:
            context = self.get_context()
        except ProjectorException:
            # User does not exist so just do nothing.
            pass
        else:
            for item in context:
                yield ProjectorRequirement(
                    view_class=UserViewSet if item['collection'] == 'users/user' else GroupViewSet,
                    view_action='retrieve',
                    pk=str(item['id']))
