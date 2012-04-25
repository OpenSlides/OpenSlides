
from django.db import models
from django.dispatch import receiver

from openslides.config.signals import default_config_value

from api import register_slidemodel
from projector import SlideMixin

from config.models import config
from utils.translation_ext import ugettext as _


class ProjectorSlide(models.Model, SlideMixin):
    prefix = 'ProjectorSlide'

    title = models.CharField(max_length=100, verbose_name=_("Title"))
    text = models.TextField(null=True, blank=True, verbose_name=_("Text"))
    #weight = models.IntegerField(default=0, verbose_name=_("Weight"))

    def slide(self):
        return {
            'slide': self,
            'title': self.title,
            'template': 'projector/ProjectorSlide.html',
        }

    def __unicode__(self):
        return self.title

    class Meta:
        permissions = (
            ('can_manage_projector', _("Can manage the projector", fixstr=True)),
            ('can_see_projector', _("Can see projector", fixstr=True)),
        )


class ProjectorOverlay(models.Model):
    active = models.BooleanField(verbose_name=_('Active'))
    def_name = models.CharField(max_length=64)
    sid = models.CharField(max_length=64, null=True, blank=True)

    def __unicode__(self):
        if self.sid:
            return "%s on %s" % (self.def_name, self.sid)
        return self.def_name


register_slidemodel(ProjectorSlide, model_name='customslide')


@receiver(default_config_value, dispatch_uid="projector_default_config")
def default_config(sender, key, **kwargs):
    return {
        'projector_message': '',
        'countdown_time': 60,
        'countdown_start_stamp': 0,
        'countdown_pause_stamp': 0,
        'countdown_state': 'inactive',
        'bigger': 100,
        'up': 0,
    }.get(key)
