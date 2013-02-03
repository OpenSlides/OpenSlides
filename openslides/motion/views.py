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
from django.utils.translation import ugettext as _, ugettext_lazy, ugettext_noop
from django.views.generic.detail import SingleObjectMixin
from django.http import Http404

from openslides.utils.pdf import stylesheet
from openslides.utils.views import (
    TemplateView, RedirectView, UpdateView, CreateView, DeleteView, PDFView,
    DetailView, ListView, FormView, QuestionMixin, SingleObjectMixin)
from openslides.utils.template import Tab
from openslides.utils.utils import html_strong
from openslides.poll.views import PollFormView
from openslides.projector.api import get_active_slide
from openslides.projector.projector import Widget, SLIDE
from openslides.config.models import config
from openslides.agenda.models import Item

from .models import Motion, MotionSubmitter, MotionSupporter, MotionPoll, MotionVersion
from .forms import (BaseMotionForm, MotionSubmitterMixin, MotionSupporterMixin,
                    MotionCreateNewVersionMixin, ConfigForm)
from .workflow import WorkflowError
from .pdf import motions_to_pdf, motion_to_pdf


class MotionListView(ListView):
    """
    List all motion.
    """
    permission_required = 'motion.can_see_motion'
    model = Motion

motion_list = MotionListView.as_view()


class GetVersionMixin(object):
    def get_object(self):
        object = super(GetVersionMixin, self).get_object()
        version_number = self.kwargs.get('version_number', None)
        if version_number is not None:
            try:
                object.version = int(version_number)
            except MotionVersion.DoesNotExist:
                raise Http404('Version %s not found' % version_number)
        return object


class MotionDetailView(GetVersionMixin, DetailView):
    """
    Show the details of one motion.
    """
    permission_required = 'motion.can_see_motion'
    model = Motion
    template_name = 'motion/motion_detail.html'

    def get_context_data(self, **kwargs):
        context = super(MotionDetailView, self).get_context_data(**kwargs)
        context['allowed_actions'] = self.object.get_allowed_actions(self.request.user)
        return context

motion_detail = MotionDetailView.as_view()


class MotionMixin(object):
    """
    Mixin to add save the version-data to the motion-object
    """
    def manipulate_object(self, form):
        super(MotionMixin, self).manipulate_object(form)
        for attr in ['title', 'text', 'reason']:
            setattr(self.object, attr, form.cleaned_data[attr])

        try:
            if form.cleaned_data['new_version']:
                self.object.new_version
        except KeyError:
            pass

    def post_save(self, form):
        super(MotionMixin, self).post_save(form)
        # TODO: only delete and save neccessary submitters and supporter
        if 'submitter' in form.cleaned_data:
            self.object.submitter.all().delete()
            MotionSubmitter.objects.bulk_create(
                [MotionSubmitter(motion=self.object, person=person)
                 for person in form.cleaned_data['submitter']])
        if 'supporter' in form.cleaned_data:
            self.object.supporter.all().delete()
            MotionSupporter.objects.bulk_create(
                [MotionSupporter(motion=self.object, person=person)
                 for person in form.cleaned_data['supporter']])

    def get_form_class(self):
        form_classes = [BaseMotionForm]
        if self.request.user.has_perm('motion.can_manage_motion'):
            form_classes.append(MotionSubmitterMixin)
            if config['motion_min_supporters'] > 0:
                form_classes.append(MotionSupporterMixin)
        if config['motion_create_new_version'] == 'ASK_USER':
            form_classes.append(MotionCreateNewVersionMixin)
        return type('MotionForm', tuple(form_classes), {})


class MotionCreateView(MotionMixin, CreateView):
    """
    Create a motion.
    """
    permission_required = 'motion.can_create_motion'
    model = Motion

    def form_valid(self, form):
        value = super(MotionCreateView, self).form_valid(form)
        self.object.write_log(ugettext_noop('Motion created'), self.request.user)
        return value

motion_create = MotionCreateView.as_view()


class MotionUpdateView(MotionMixin, UpdateView):
    """
    Update a motion.
    """
    model = Motion

    def has_permission(self, request, *args, **kwargs):
        return self.get_object().get_allowed_actions(request.user)['edit']

    def form_valid(self, form):
        value = super(MotionUpdateView, self).form_valid(form)
        self.object.write_log(ugettext_noop('Motion updated'), self.request.user)
        return value

motion_edit = MotionUpdateView.as_view()


class MotionDeleteView(DeleteView):
    """
    Delete one Motion.
    """
    model = Motion
    success_url_name = 'motion_list'

    def has_permission(self, request, *args, **kwargs):
        return self.get_object().get_allowed_actions(request.user)['delete']

motion_delete = MotionDeleteView.as_view()


class VersionPermitView(GetVersionMixin, SingleObjectMixin, QuestionMixin, RedirectView):
    model = Motion
    question_url_name = 'motion_version_detail'
    success_url_name = 'motion_version_detail'

    def get(self, *args, **kwargs):
        self.object = self.get_object()
        return super(VersionPermitView, self).get(*args, **kwargs)

    def get_url_name_args(self):
        return [self.object.pk, self.object.version.version_number]

    def get_question(self):
        return _('Are you sure you want permit Version %s?') % self.object.version.version_number

    def case_yes(self):
        self.object.activate_version(self.object.version)
        self.object.save()

version_permit = VersionPermitView.as_view()


class VersionRejectView(GetVersionMixin, SingleObjectMixin, QuestionMixin, RedirectView):
    model = Motion
    question_url_name = 'motion_version_detail'
    success_url_name = 'motion_version_detail'

    def get(self, *args, **kwargs):
        self.object = self.get_object()
        return super(VersionRejectView, self).get(*args, **kwargs)

    def get_url_name_args(self):
        return [self.object.pk, self.object.version.version_number]

    def get_question(self):
        return _('Are you sure you want reject Version %s?') % self.object.version.version_number

    def case_yes(self):
        self.object.reject_version(self.object.version)
        self.object.save()

version_reject = VersionRejectView.as_view()


class SupportView(SingleObjectMixin, QuestionMixin, RedirectView):
    """
    Classed based view to support or unsupport a motion. Use
    support=True or support=False in urls.py
    """
    permission_required = 'motion.can_support_motion'
    model = Motion
    support = True

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        return super(SupportView, self).get(request, *args, **kwargs)

    def check_permission(self, request):
        """
        Checks whether request.user can support or unsupport the motion.
        Returns True or False.
        """
        allowed_actions = self.object.get_allowed_actions(request.user)
        if self.support and not allowed_actions['support']:
            messages.error(request, _('You can not support this motion.'))
            return False
        elif not self.support and not allowed_actions['unsupport']:
            messages.error(request, _('You can not unsupport this motion.'))
            return False
        else:
            return True

    def pre_redirect(self, request, *args, **kwargs):
        if self.check_permission(request):
            super(SupportView, self).pre_redirect(request, *args, **kwargs)

    def get_question(self):
        if self.support:
            return _('Do you really want to support this motion?')
        else:
            return _('Do you really want to unsupport this motion?')

    def case_yes(self):
        if self.check_permission(self.request):
            user = self.request.user
            if self.support:
                self.object.support(person=user)
                self.object.write_log(ugettext_noop("Supporter: +%s") % user, user)
            else:
                self.object.unsupport(person=user)
                self.object.write_log(ugettext_noop("Supporter: -%s") % user, user)

    def get_success_message(self):
        if self.support:
            return _("You have supported this motion successfully.")
        else:
            return _("You have unsupported this motion successfully.")

    def get_redirect_url(self, **kwargs):
        return self.object.get_absolute_url()

motion_support = SupportView.as_view(support=True)
motion_unsupport = SupportView.as_view(support=False)


class PollCreateView(SingleObjectMixin, RedirectView):
    permission_required = 'motion.can_manage_motion'
    model = Motion

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        return super(PollCreateView, self).get(request, *args, **kwargs)

    def pre_redirect(self, request, *args, **kwargs):
        self.poll = self.object.create_poll()
        self.object.write_log(ugettext_noop("Poll created"), request.user)
        messages.success(request, _("New vote was successfully created."))

    def get_redirect_url(self, **kwargs):
        return reverse('motion_poll_edit', args=[self.object.pk, self.poll.poll_number])

poll_create = PollCreateView.as_view()


class PollMixin(object):
    permission_required = 'motion.can_manage_motion'
    success_url_name = 'motion_detail'

    def get_object(self):
        return MotionPoll.objects.filter(
            motion=self.kwargs['pk'],
            poll_number=self.kwargs['poll_number']).get()

    def get_url_name_args(self):
        return [self.object.motion.pk]


class PollUpdateView(PollMixin, PollFormView):
    poll_class = MotionPoll
    template_name = 'motion/poll_form.html'

    def get_context_data(self, **kwargs):
        context = super(PollUpdateView, self).get_context_data(**kwargs)
        context.update({
            'motion': self.poll.motion})
        return context

    def form_valid(self, form):
        value = super(PollUpdateView, self).form_valid(form)
        self.object.write_log(ugettext_noop('Poll updated'), self.request.user)
        return value

poll_edit = PollUpdateView.as_view()


class PollDeleteView(PollMixin, DeleteView):
    model = MotionPoll

    def case_yes(self):
        super(PollDeleteView, self).case_yes()
        self.object.write_log(ugettext_noop('Poll deleted'), self.request.user)

poll_delete = PollDeleteView.as_view()


class MotionSetStateView(SingleObjectMixin, RedirectView):
    permission_required = 'motion.can_manage_motion'
    url_name = 'motion_detail'
    model = Motion
    reset = False

    def pre_redirect(self, request, *args, **kwargs):
        self.object = self.get_object()
        try:
            if self.reset:
                self.object.reset_state()
            else:
                self.object.state = kwargs['state']
        except WorkflowError, e:
            messages.error(request, e)
        else:
            self.object.save()
            # TODO: the state is not translated
            self.object.write_log(ugettext_noop('Changed state to %s') %
                                  self.object.state.name, self.request.user)
            messages.success(request, _('Motion status was set to: %s.'
                                        % html_strong(self.object.state)))

    def get_url_name_args(self):
        return [self.object.pk]

set_state = MotionSetStateView.as_view()
reset_state = MotionSetStateView.as_view(reset=True)


class CreateAgendaItemView(SingleObjectMixin, RedirectView):
    permission_required = 'agenda.can_manage_agenda'
    url_name = 'item_overview'
    model = Motion

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        return super(CreateAgendaItemView, self).get(request, *args, **kwargs)

    def pre_redirect(self, request, *args, **kwargs):
        self.item = Item.objects.create(related_sid=self.object.sid)
        self.object.write_log(ugettext_noop('Created Agenda Item'), self.request.user)

create_agenda_item = CreateAgendaItemView.as_view()


class MotionPDFView(SingleObjectMixin, PDFView):
    permission_required = 'motion.can_manage_motion'
    model = Motion
    top_space = 0
    print_all_motions = False

    def get(self, request, *args, **kwargs):
        if not self.print_all_motions:
            self.object = self.get_object()
        return super(MotionPDFView, self).get(request, *args, **kwargs)

    def get_filename(self):
        if self.print_all_motions:
            return _("Motions")
        else:
            return _("Motion: %s") % unicode(self.object)

    def append_to_pdf(self, pdf):
        if self.print_all_motions:
            motions_to_pdf(pdf)
        else:
            motion_to_pdf(pdf, self.object)

motion_list_pdf = MotionPDFView.as_view(print_all_motions=True)
motion_detail_pdf = MotionPDFView.as_view(print_all_motions=False)


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
            'motion_create_new_version': config['motion_create_new_version'],
            'motion_workflow': config['motion_workflow'],
        }

    def form_valid(self, form):
        config['motion_min_supporters'] = form.cleaned_data['motion_min_supporters']
        config['motion_preamble'] = form.cleaned_data['motion_preamble']
        config['motion_pdf_ballot_papers_selection'] = form.cleaned_data['motion_pdf_ballot_papers_selection']
        config['motion_pdf_ballot_papers_number'] = form.cleaned_data['motion_pdf_ballot_papers_number']
        config['motion_pdf_title'] = form.cleaned_data['motion_pdf_title']
        config['motion_pdf_preamble'] = form.cleaned_data['motion_pdf_preamble']
        config['motion_create_new_version'] = form.cleaned_data['motion_create_new_version']
        config['motion_workflow'] = form.cleaned_data['motion_workflow']
        messages.success(self.request, _('Motion settings successfully saved.'))
        return super(Config, self).form_valid(form)


def register_tab(request):
    """
    Register the projector tab.
    """
    selected = request.path.startswith('/motion/')
    return Tab(
        title=_('Motions'),
        app='motion',
        url=reverse('motion_list'),
        permission=request.user.has_perm('motion.can_see_motion'),
        selected=selected,
    )


def get_widgets(request):
    return [Widget(
        name='motions',
        display_name=_('Motions'),
        template='motion/widget.html',
        context={'motions': Motion.objects.all()},
        permission_required='projector.can_manage_projector')]
