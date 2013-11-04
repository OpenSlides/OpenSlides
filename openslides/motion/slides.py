# -*- coding: utf-8 -*-

from openslides.projector.api import register_slide_model

from .models import Motion

register_slide_model(Motion, 'motion/slide.html')
