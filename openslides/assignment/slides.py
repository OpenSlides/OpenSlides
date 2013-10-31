# -*- coding: utf-8 -*-

from openslides.projector.api import register_slide_model

from .models import Assignment

register_slide_model(Assignment, 'assignment/slide.html')
