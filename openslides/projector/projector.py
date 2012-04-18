from time import time

from django.dispatch import receiver
from django.utils.translation import ugettext as _

from config.models import config

from openslides.projector.signals import projector_overlays


SLIDE = {}

class SlideMixin(object):

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
            if type(self) == value.model:
                return "%s-%d" % (key, self.id)
        return None

    @property
    def active(self):
        """
        Return True, if the the slide is the active one.
        """
        from api import get_active_slide
        return True if get_active_slide(only_sid=True) == self.sid else False

    def set_active(self):
        """
        Appoint this item as the active one.
        """
        config["presentation"] = "%s-%d" % (self.prefix, self.id)


class Slide(object):
    def __init__(self, model_slide=False, func=None, model=None, category=None,
                 key=None, model_name='', control_template='', weight=0, name=''):
        """
        model_slide: Boolean if the value is a Model.
        func: The function to call. Only if modelslide is False.
        model: The model. Only if modelslide is True.
        model_name: The name shown for the model.
        category: The category to show this Slide.
        key: the key in the slide object to find itself.
        """
        self.model_slide = model_slide
        self.func = func
        self.model = model
        self.model_name = model_name
        self.category = category
        self.key = key
        self.control_template = control_template
        self.weight = weight
        self.name = name

    @property
    def active(self):
        from api import get_active_slide
        return get_active_slide(True) == self.key

    def get_items(self):
        try:
            return self.model.objects.all()
        except AttributeError:
            return 'No Model'


@receiver(projector_overlays, dispatch_uid="projector_countdown")
def countdown(sender, **kwargs):
    name = 'Countdown'
    if kwargs['register']:
        return name
    if name in kwargs['call']:
        starttime = config['countdown_start']
        seconds = max(0, int(starttime + config['agenda_countdown_time'] - time()))
        return (name, seconds)
    return None


@receiver(projector_overlays, dispatch_uid="projector_message")
def projector_message(sender, **kwargs):
    name = 'Message'
    if kwargs['register']:
        return name
    if name in kwargs['call']:
        message = config['projector_message']
        if message != '':
            return (name, message)
    return None
