from django.db import models
from django.utils.translation import ugettext as _

from api import register_slidemodel
from projector import SlideMixin

from system import config


class ProjectorSlide(models.Model, SlideMixin):
    prefix = 'ProjectorSlide'

    title = models.CharField(max_length=100, verbose_name=_("Title"))
    text = models.TextField(null=True, blank=True, verbose_name=_("Text"))
    weight = models.IntegerField(default=0, verbose_name=_("Weight"))

    def __unicode__(self):
        return self.title

    class Meta:
        permissions = (
            ('can_manage_projector', "Can manage the projector"),
            ('can_see_projector', "Can see projector"),
        )

register_slidemodel(ProjectorSlide, category=_('Projector'), model_name=_('Projector Slide'))
