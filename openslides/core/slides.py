# -*- coding: utf-8 -*-

from openslides.projector.api import register_slide_model

from .models import CustomSlide

register_slide_model(CustomSlide, 'core/customslide_slide.html')
