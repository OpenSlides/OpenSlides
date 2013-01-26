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
from django.http import Http404

from openslides.utils.pdf import stylesheet
from openslides.utils.views import (
    TemplateView, RedirectView, UpdateView, CreateView, DeleteView, PDFView,
    DetailView, ListView, FormView)
from openslides.utils.template import Tab
from openslides.utils.utils import html_strong
from openslides.projector.api import get_active_slide
from openslides.projector.projector import Widget, SLIDE
from openslides.config.models import config
from .models import Motion, MotionSubmitter, MotionSupporter
from .forms import (BaseMotionForm, MotionSubmitterMixin, MotionSupporterMixin,
                    MotionTrivialChangesMixin, ConfigForm)

class MotionListView(ListView):
    """
    List all motion.
    """
    permission_required = 'motion.can_see_motion'
    model = Motion

motion_list = MotionListView.as_view()


class MotionDetailView(DetailView):
    """
    Show the details of one motion.
    """
    permission_required = 'motion.can_see_motion'
    model = Motion
    template_name = 'motion/motion_detail.html'

    def get_object(self):
        object = super(MotionDetailView, self).get_object()
        version_id = self.kwargs.get('version_id', None)
        if version_id is not None:
            try:
                object.version = int(version_id) -1
            except IndexError:
                raise Http404
        return object

motion_detail = MotionDetailView.as_view()


class MotionMixin(object):
    """
    Mixin to add save the version-data to the motion-object
    """
    def manipulate_object(self, form):
        super(MotionMixin, self).manipulate_object(form)
        for attr in ['title', 'text', 'reason']:
            setattr(self.object, attr, form.cleaned_data[attr])

    def post_save(self, form):
        super(MotionMixin, self).post_save(form)
        # TODO: only delete and save neccessary submitters and supporter
        self.object.submitter.all().delete()
        self.object.supporter.all().delete()
        MotionSubmitter.objects.bulk_create(
            [MotionSubmitter(motion=self.object, person=person)
             for person in form.cleaned_data['submitter']])
        MotionSupporter.objects.bulk_create(
            [MotionSupporter(motion=self.object, person=person)
             for person in form.cleaned_data['supporter']])

    def get_form_class(self):
        form_classes = [BaseMotionForm]
        if self.request.user.has_perm('motion.can_manage_motion'):
            form_classes.append(MotionSubmitterMixin)
            if config['motion_min_supporters'] > 0:
                form_classes.append(MotionSupporterMixin)
        if config['motion_allow_trivial_change']:
            form_classes.append(MotionTrivialChangesMixin)
        return type('MotionForm', tuple(form_classes), {})


class MotionCreateView(MotionMixin, CreateView):
    """
    Create a motion.
    """
    permission_required = 'motion.can_create_motion'
    model = Motion

motion_create = MotionCreateView.as_view()


class MotionUpdateView(MotionMixin, UpdateView):
    """
    Update a motion.
    """
    # TODO: set permissions
    model = Motion

motion_edit = MotionUpdateView.as_view()


class Config(FormView):
    permission_required = 'config.can_manage_config'
    form_class = ConfigForm
    template_name = 'motion/config.html'
    success_url_name = 'config_motion'

    def get_initial(self):
        return {
            'motion_min_supporters': config['motion_min_supporters'],
            'motion_preamble': config['motion_preamble'],
            'motion_pdf_ballot_papers_selection': config['motion_pdf_ballot_papers_selection'],
            'motion_pdf_ballot_papers_number': config['motion_pdf_ballot_papers_number'],
            'motion_pdf_title': config['motion_pdf_title'],
            'motion_pdf_preamble': config['motion_pdf_preamble'],
            'motion_allow_trivial_change': config['motion_allow_trivial_change'],
        }

    def form_valid(self, form):
        config['motion_min_supporters'] = form.cleaned_data['motion_min_supporters']
        config['motion_preamble'] = form.cleaned_data['motion_preamble']
        config['motion_pdf_ballot_papers_selection'] = form.cleaned_data['motion_pdf_ballot_papers_selection']
        config['motion_pdf_ballot_papers_number'] = form.cleaned_data['motion_pdf_ballot_papers_number']
        config['motion_pdf_title'] = form.cleaned_data['motion_pdf_title']
        config['motion_pdf_preamble'] = form.cleaned_data['motion_pdf_preamble']
        config['motion_allow_trivial_change'] = form.cleaned_data['motion_allow_trivial_change']
        messages.success(self.request, _('Motion settings successfully saved.'))
        return super(Config, self).form_valid(form)


def register_tab(request):
    """
    Register the projector tab.
    """
    selected = request.path.startswith('/motion/')
    return Tab(
        title=_('Motions'),
        url=reverse('motion_list'),
        permission=request.user.has_perm('motion.can_see_motion'),
        selected=selected,
    )
