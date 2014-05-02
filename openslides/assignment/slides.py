# -*- coding: utf-8 -*-

from openslides.projector.api import register_slide_model

from .models import Assignment, AssignmentPoll

register_slide_model(Assignment, 'assignment/slide.html')
register_slide_model(AssignmentPoll, 'assignment/assignmentpoll_slide.html')
