from django.db import models

from system import config

SLIDE = {}

class Slide(object):

    def slide(self):
        """
        Return a map with all Data for a Slide
        """
        return {
            'slide': self,
            'title': 'dummy-title',
            'template': 'projector/default.html',
        }

    @property
    def sid(self):
        """
        Return the sid from this Slide
        """
        for key, value in SLIDE.iteritems():
            if type(self) == value:
                return "%s %d" % (key, self.id)
        return None

    @property
    def active(self):
        """
        Return True, if the the slide is the active one.
        """
        from projector.api import get_active_slide
        return True if get_active_slide(only_sid=True) == self.sid else False

    def set_active(self):
        """
        Appoint this item as the active one.
        """
        config["presentation"] = "%s %d" % (self.prefix, self.id)
