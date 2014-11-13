from django.utils.translation import ugettext_lazy

from openslides.config.api import config
from openslides.projector.api import get_active_slide
from openslides.utils.widgets import Widget

from .models import CustomSlide


class WelcomeWidget(Widget):
    """
    Welcome widget with static info for all users.
    """
    name = 'welcome'
    required_permission = 'core.can_see_dashboard'
    default_column = 1
    default_weight = 10
    template_name = 'core/widget_welcome.html'
    icon_css_class = 'icon-home'

    def get_verbose_name(self):
        return config['welcome_title']


class CustonSlideWidget(Widget):
    """
    Widget to control custom slides.
    """
    name = 'custom_slide'
    verbose_name = ugettext_lazy('Custom Slides')
    required_permission = 'core.can_manage_projector'
    default_column = 2
    default_weight = 30
    template_name = 'core/widget_customslide.html'
    context = None
    icon_css_class = 'icon-star'

    def get_context_data(self, **context):
        """
        Adds custom slides and a flag whether the welcome page is active to
        the context.
        """
        context['slides'] = CustomSlide.objects.all().order_by('weight')
        context['welcomepage_is_active'] = (
            get_active_slide().get('callback', 'default') == 'default')
        return super(CustonSlideWidget, self).get_context_data(**context)
