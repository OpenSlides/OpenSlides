#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.views
    ~~~~~~~~~~~~~~~~~~~~~~~

    Views for the motion app.

    :copyright: 2011, 2012 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from reportlab.platypus import Paragraph

from django.core.urlresolvers import reverse
from django.contrib import messages
from django.db import transaction
from django.db.models import Model
from django.utils.translation import ugettext as _, ugettext_lazy
from django.views.generic.detail import SingleObjectMixin

from openslides.utils.pdf import stylesheet
from openslides.utils.views import (
    TemplateView, RedirectView, UpdateView, CreateView, DeleteView, PDFView,
    DetailView, ListView)
from openslides.utils.template import Tab
from openslides.utils.utils import html_strong
from openslides.projector.api import get_active_slide
from openslides.projector.projector import Widget, SLIDE
from .models import Motion
from .forms import MotionCreateForm, MotionUpdateForm


from django.views.generic.edit import ModelFormMixin


class MotionListView(ListView):
    permission_required = 'motion.can_see_motion'
    model = Motion

motion_list = MotionListView.as_view()


class MotionDetailView(DetailView):
    permission_required = 'motion.can_see_motion'
    model = Motion
    template_name = 'motion/motion_detail.html'

    def get_object(self):
        object = super(MotionDetailView, self).get_object()
        version_id = self.kwargs.get('version_id', None)
        if version_id is not None:
            object.default_version = int(version_id) -1
        return object

motion_detail = MotionDetailView.as_view()


class MotionMixin(object):
    def manipulate_object(self, form):
        for attr in ['title', 'text', 'reason']:
            setattr(self.object, attr, form.cleaned_data[attr])


class MotionCreateView(MotionMixin, CreateView):
    permission_required = 'motion.can_create_motion'
    model = Motion
    form_class = MotionCreateForm

motion_create = MotionCreateView.as_view()


class MotionUpdateView(MotionMixin, UpdateView):
    model = Motion
    form_class = MotionUpdateForm

motion_edit = MotionUpdateView.as_view()
