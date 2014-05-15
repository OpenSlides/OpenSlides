# -*- coding: utf-8 -*-

from django.contrib.auth.models import AnonymousUser
from django.utils.translation import ugettext_lazy

from openslides.utils.personal_info import PersonalInfo
from openslides.utils.widgets import Widget


class PersonalInfoWidget(Widget):
    """
    Provides a widget for personal info. It shows all info block given by the
    personal info api. See openslides.utils.personal_info.PersonalInfo.
    """
    name = 'personal_info'
    verbose_name = ugettext_lazy('My personal info')
    default_column = 1
    default_weight = 80
    template_name = 'account/widget_personal_info.html'
    icon_css_class = 'icon-flag'

    def check_permission(self):
        """
        The widget is disabled for anonymous users.
        """
        return not isinstance(self.request.user, AnonymousUser)

    def is_active(self):
        """
        The widget is disabled if there are no info blocks at the moment.
        """
        for infoblock in PersonalInfo.get_all(self.request):
            if infoblock.is_active():
                active = super(PersonalInfoWidget, self).is_active()
                break
        else:
            active = False
        return active

    def get_context_data(self, **context):
        """
        Adds the context to the widget.
        """
        return super(PersonalInfoWidget, self).get_context_data(infoblocks=PersonalInfo.get_all(self.request), **context)
