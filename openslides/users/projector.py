from django.utils.translation import ugettext as _

from openslides.core.exceptions import ProjectorException
from openslides.utils.projector import ProjectorElement

from .models import User


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
