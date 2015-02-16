from django.utils.translation import ugettext_lazy

from openslides.utils.widgets import Widget

from .models import User


class UserWidget(Widget):
    """
    Provides a widget with all users. This is for short activation of
    user slides.
    """
    name = 'user'
    verbose_name = ugettext_lazy('Users')
    required_permission = 'core.can_manage_projector'
    default_column = 1
    default_weight = 60
    default_active = False
    template_name = 'users/widget_user.html'

    def get_context_data(self, **context):
        return super(UserWidget, self).get_context_data(
            users=User.objects.all(),
            **context)
