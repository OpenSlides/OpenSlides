# -*- coding: utf-8 -*-

from openslides.projector.api import register_slide_model

from .models import Motion, MotionPoll

register_slide_model(Motion, 'motion/slide.html')
register_slide_model(MotionPoll, 'motion/motionpoll_slide.html')
