from django.db import models

from system.api import config_set, config_get

ELEMENT = {}

class Element(object):

    def slide(self):
        """
        Return a map with all Data for a Slide
        """
        return {
            'element': self,
            'title': 'dummy-title',
        }

    @property
    def eid(self):
        """
        Return the eid from this element
        """
        for key, value in ELEMENT.iteritems():
            if type(self) == value:
                return "%s %d" % (key, self.id)
        return None

    @property
    def active(self):
        """
        Return True, if the the element is the active one.
        """
        from projector.api import get_active_element
        return True if get_active_element(only_eid=True) == self.eid else False

    def set_active(self):
        """
        Appoint this item as the active one.
        """
        config_set("presentation", "%s %d" % (self.prefix, self.id))
