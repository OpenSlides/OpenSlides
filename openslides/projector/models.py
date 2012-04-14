from django.db import models

from api import register_slidemodel
from projector import SlideMixin

from config.models import config
from utils.translation_ext import ugettext as _


class ProjectorSlide(models.Model, SlideMixin):
    prefix = 'ProjectorSlide'

    title = models.CharField(max_length=100, verbose_name=_("Title"))
    text = models.TextField(null=True, blank=True, verbose_name=_("Text"))
    weight = models.IntegerField(default=0, verbose_name=_("Weight"))

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


class ProjectorMessage(models.Model):
    active = models.BooleanField(verbose_name=_('Active'))
    def_name = models.CharField(max_length=64)

    def __unicode__(self):
        return self.def_name


register_slidemodel(ProjectorSlide, model_name=_('Projector Slide'))

