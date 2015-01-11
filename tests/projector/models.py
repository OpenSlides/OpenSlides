from django.db import models

from openslides.projector.models import SlideMixin


class DummySlideMixinModel(SlideMixin, models.Model):
    """
    Dummy model to test the SlideMixin.
    """
    slide_callback_name = 'dummy_slides_mixin_model_geu3AiceeG9eo6ohChoD'
    title = models.CharField(max_length=255)
