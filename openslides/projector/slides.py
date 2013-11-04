# -*- coding: utf-8 -*-

from openslides.projector.api import register_slide_model

from .models import ProjectorSlide

register_slide_model(ProjectorSlide, 'projector/slide_projectorslide.html')
