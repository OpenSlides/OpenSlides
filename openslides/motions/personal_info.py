from django.utils.translation import ugettext_lazy

from openslides.config.api import config
from openslides.utils.personal_info import PersonalInfo


class MotionSubmitterPersonalInfo(PersonalInfo):
    """
    Class for personal info block for motion submitters.
    """
    headline = ugettext_lazy('I submitted the following motions')
    default_weight = 20

    def get_queryset(self):
        return None  # TODO: Fix this after transforming everything using AngularJS.


class MotionSupporterPersonalInfo(PersonalInfo):
    """
    Class for personal info block for motion supporters.
    """
    headline = ugettext_lazy('I support the following motions')
    default_weight = 30

    def get_queryset(self):
        if config['motion_min_supporters']:
            return_value = None  # TODO: Fix this after transforming everything using AngularJS.
        else:
            return_value = None
        return return_value
