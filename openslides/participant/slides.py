# -*- coding: utf-8 -*-

from openslides.projector.api import register_slide_model

from .models import Group, User

register_slide_model(User, 'participant/user_slide.html')
register_slide_model(Group, 'participant/group_slide.html')
