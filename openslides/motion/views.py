#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.views
    ~~~~~~~~~~~~~~~~~~~~~~~

    Views for the motion app.

    Will automaticly imported from openslides.motion.urls.py

    :copyright: (c) 2011-2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

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
    """View, to list all motions."""
    permission_required = 'motion.can_see_motion'
    model = Motion

motion_list = MotionListView.as_view()


class GetVersionMixin(object):
    """Mixin to set a specific version to a motion."""

    def get_object(self):
        """Return a Motion object. The id is taken from the url and the version
        is set to the version with the 'version_number' from the URL."""
        object = super(GetVersionMixin, self).get_object()
        version_number = self.kwargs.get('version_number', None)
        if version_number is not None:
            try:
                object.version = int(version_number)
            except MotionVersion.DoesNotExist:
                raise Http404('Version %s not found' % version_number)
        return object


class MotionDetailView(GetVersionMixin, DetailView):
    """Show one motion."""
    permission_required = 'motion.can_see_motion'
    model = Motion

    def get_context_data(self, **kwargs):
        """Return the template context.

        Append the allowed actions for the motion to the context.
        """
        context = super(MotionDetailView, self).get_context_data(**kwargs)
        context['allowed_actions'] = self.object.get_allowed_actions(self.request.user)
        return context

motion_detail = MotionDetailView.as_view()


class MotionMixin(object):
    """Mixin for MotionViewsClasses, to save the version data."""

    def manipulate_object(self, form):
        """Save the version data into the motion object before it is saved in
        the Database."""

        super(MotionMixin, self).manipulate_object(form)
        for attr in ['title', 'text', 'reason']:
            setattr(self.object, attr, form.cleaned_data[attr])

        try:
            if form.cleaned_data['new_version']:
                self.object.new_version
        except KeyError:
            pass

    def post_save(self, form):
        """Save the submitter an the supporter so the motion."""
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
        """Return the FormClass to Create or Update the Motion.

        forms.BaseMotionForm is the base for the Class, and some FormMixins
        will be mixed in dependence of some config values. See motion.forms
        for more information on the mixins.
        """

        form_classes = [BaseMotionForm]
        if self.request.user.has_perm('motion.can_manage_motion'):
            form_classes.append(MotionSubmitterMixin)
            if config['motion_min_supporters'] > 0:
                form_classes.append(MotionSupporterMixin)
        if config['motion_create_new_version'] == 'ASK_USER':
            form_classes.append(MotionCreateNewVersionMixin)
        return type('MotionForm', tuple(form_classes), {})


class MotionCreateView(MotionMixin, CreateView):
    """View to create a motion."""
    permission_required = 'motion.can_create_motion'
    model = Motion

    def form_valid(self, form):
        """Write a log message, if the form is valid."""
        value = super(MotionCreateView, self).form_valid(form)
        self.object.write_log(ugettext_noop('Motion created'), self.request.user)
        return value

motion_create = MotionCreateView.as_view()


class MotionUpdateView(MotionMixin, UpdateView):
    """View to update a motion."""
    model = Motion

    def has_permission(self, request, *args, **kwargs):
        """Check, if the request.user has the permission to edit the motion."""
        return self.get_object().get_allowed_actions(request.user)['edit']

    def form_valid(self, form):
        """Write a log message, if the form is valid."""
        value = super(MotionUpdateView, self).form_valid(form)
        self.object.write_log(ugettext_noop('Motion updated'), self.request.user)
        return value

motion_edit = MotionUpdateView.as_view()


class MotionDeleteView(DeleteView):
    """View to delete a motion."""
    model = Motion
    success_url_name = 'motion_list'

    def has_permission(self, request, *args, **kwargs):
        """Check if the request.user has the permission to delete the motion."""
        return self.get_object().get_allowed_actions(request.user)['delete']

motion_delete = MotionDeleteView.as_view()


class VersionPermitView(GetVersionMixin, SingleObjectMixin, QuestionMixin, RedirectView):
    """View to permit a version of a motion."""

    model = Motion
    question_url_name = 'motion_version_detail'
    success_url_name = 'motion_version_detail'

    def get(self, *args, **kwargs):
        """Set self.object to a motion."""
        self.object = self.get_object()
        return super(VersionPermitView, self).get(*args, **kwargs)

    def get_url_name_args(self):
        """Return a list with arguments to create the success- and question_url."""
        return [self.object.pk, self.object.version.version_number]

    def get_question(self):
        """Return a string, shown to the user as question to permit the version."""
        return _('Are you sure you want permit Version %s?') % self.object.version.version_number

    def case_yes(self):
        """Activate the version, if the user chooses 'yes'."""
        self.object.activate_version(self.object.version)
        self.object.save()

version_permit = VersionPermitView.as_view()


class VersionRejectView(GetVersionMixin, SingleObjectMixin, QuestionMixin, RedirectView):
    """View to reject a version."""
    model = Motion
    question_url_name = 'motion_version_detail'
    success_url_name = 'motion_version_detail'

    def get(self, *args, **kwargs):
        """Set self.object to a motion."""
        self.object = self.get_object()
        return super(VersionRejectView, self).get(*args, **kwargs)

    def get_url_name_args(self):
        """Return a list with arguments to create the success- and question_url."""
        return [self.object.pk, self.object.version.version_number]

    def get_question(self):
        return _('Are you sure you want reject Version %s?') % self.object.version.version_number

    def case_yes(self):
        """Reject the version, if the user chooses 'yes'."""
        self.object.reject_version(self.object.version)
        self.object.save()

version_reject = VersionRejectView.as_view()


class SupportView(SingleObjectMixin, QuestionMixin, RedirectView):
    """View to support or unsupport a motion.

    If self.support is True, the view will append a request.user to the supporter list.

    If self.support is False, the view will remove a request.user from the supporter list.
    """

    permission_required = 'motion.can_support_motion'
    model = Motion
    support = True

    def get(self, request, *args, **kwargs):
        """Set self.object to a motion."""
        self.object = self.get_object()
        return super(SupportView, self).get(request, *args, **kwargs)

    def check_permission(self, request):
        """Return True if the user can support or unsupport the motion. Else: False."""

        allowed_actions = self.object.get_allowed_actions(request.user)
        if self.support and not allowed_actions['support']:
            messages.error(request, _('You can not support this motion.'))
            return False
        elif not self.support and not allowed_actions['unsupport']:
            messages.error(request, _('You can not unsupport this motion.'))
            return False
        else:
            return True

    def get_question(self):
        """Return the question string."""
        if self.support:
            return _('Do you really want to support this motion?')
        else:
            return _('Do you really want to unsupport this motion?')

    def case_yes(self):
        """Append or remove the request.user from the motion.

        First the methode checks the permissions, and writes a log message after
        appending or removing the user.
        """
        if self.check_permission(self.request):
            user = self.request.user
            if self.support:
                self.object.support(person=user)
                self.object.write_log(ugettext_noop("Supporter: +%s") % user, user)
            else:
                self.object.unsupport(person=user)
                self.object.write_log(ugettext_noop("Supporter: -%s") % user, user)

    def get_success_message(self):
        """Return the success message."""
        if self.support:
            return _("You have supported this motion successfully.")
        else:
            return _("You have unsupported this motion successfully.")

    def get_redirect_url(self, **kwargs):
        """Return the url, the view should redirect to."""
        return self.object.get_absolute_url()

motion_support = SupportView.as_view(support=True)
motion_unsupport = SupportView.as_view(support=False)


class PollCreateView(SingleObjectMixin, RedirectView):
    """View to create a poll for a motion."""
    permission_required = 'motion.can_manage_motion'
    model = Motion

    def get(self, request, *args, **kwargs):
        """Set self.object to a motion."""
        self.object = self.get_object()
        return super(PollCreateView, self).get(request, *args, **kwargs)

    def pre_redirect(self, request, *args, **kwargs):
        """Create the poll for the motion."""
        self.poll = self.object.create_poll()
        self.object.write_log(ugettext_noop("Poll created"), request.user)
        messages.success(request, _("New vote was successfully created."))

    def get_redirect_url(self, **kwargs):
        """Return the URL to the EditView of the poll."""
        return reverse('motion_poll_edit', args=[self.object.pk, self.poll.poll_number])

poll_create = PollCreateView.as_view()


class PollMixin(object):
    """Mixin for the PollUpdateView and the PollDeleteView."""
    permission_required = 'motion.can_manage_motion'
    success_url_name = 'motion_detail'

    def get_object(self):
        """Return a MotionPoll object.

        Use the motion id and the poll_number from the url kwargs to get the
        object.
        """
        return MotionPoll.objects.filter(
            motion=self.kwargs['pk'],
            poll_number=self.kwargs['poll_number']).get()

    def get_url_name_args(self):
        """Return the arguments to create the url to the success_url"""
        return [self.object.motion.pk]


class PollUpdateView(PollMixin, PollFormView):
    """View to update a MotionPoll."""

    poll_class = MotionPoll
    """Poll Class to use for this view."""

    template_name = 'motion/poll_form.html'

    def get_context_data(self, **kwargs):
        """Return the template context.

        Append the motion object to the context.
        """
        context = super(PollUpdateView, self).get_context_data(**kwargs)
        context.update({
            'motion': self.poll.motion})
        return context

    def form_valid(self, form):
        """Write a log message, if the form is valid."""
        value = super(PollUpdateView, self).form_valid(form)
        self.object.write_log(ugettext_noop('Poll updated'), self.request.user)
        return value

poll_edit = PollUpdateView.as_view()


class PollDeleteView(PollMixin, DeleteView):
    """View to delete a MotionPoll."""
    model = MotionPoll

    def case_yes(self):
        """Write a log message, if the form is valid."""
        super(PollDeleteView, self).case_yes()
        self.object.write_log(ugettext_noop('Poll deleted'), self.request.user)

poll_delete = PollDeleteView.as_view()


class MotionSetStateView(SingleObjectMixin, RedirectView):
    """View to set the state of a motion.

    If self.reset is False, the new state is taken from url.

    If self.reset is True, the default state is taken.
    """
    permission_required = 'motion.can_manage_motion'
    url_name = 'motion_detail'
    model = Motion
    reset = False

    def pre_redirect(self, request, *args, **kwargs):
        """Save the new state and write a log message."""
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
        """Return the arguments to generate the redirect_url."""
        return [self.object.pk]

set_state = MotionSetStateView.as_view()
reset_state = MotionSetStateView.as_view(reset=True)


class CreateAgendaItemView(SingleObjectMixin, RedirectView):
    """View to create and agenda item for a motion."""
    permission_required = 'agenda.can_manage_agenda'
    url_name = 'item_overview'
    model = Motion

    def get(self, request, *args, **kwargs):
        """Set self.object to a motion."""
        self.object = self.get_object()
        return super(CreateAgendaItemView, self).get(request, *args, **kwargs)

    def pre_redirect(self, request, *args, **kwargs):
        """Create the agenda item."""
        self.item = Item.objects.create(related_sid=self.object.sid)
        self.object.write_log(ugettext_noop('Created Agenda Item'), self.request.user)

create_agenda_item = CreateAgendaItemView.as_view()


class MotionPDFView(SingleObjectMixin, PDFView):
    """Create the PDF for one, or all motions.

    If self.print_all_motions is True, the view returns a PDF with all motions.

    If self.print_all_motions is False, the view returns a PDF with only one
    motion."""
    permission_required = 'motion.can_manage_motion'
    model = Motion
    top_space = 0
    print_all_motions = False

    def get(self, request, *args, **kwargs):
        """Set self.object to a motion."""
        if not self.print_all_motions:
            self.object = self.get_object()
        return super(MotionPDFView, self).get(request, *args, **kwargs)

    def get_filename(self):
        """Return the filename for the PDF."""
        if self.print_all_motions:
            return _("Motions")
        else:
            return _("Motion: %s") % unicode(self.object)

    def append_to_pdf(self, pdf):
        """Append PDF objects."""
        if self.print_all_motions:
            motions_to_pdf(pdf)
        else:
            motion_to_pdf(pdf, self.object)

motion_list_pdf = MotionPDFView.as_view(print_all_motions=True)
motion_detail_pdf = MotionPDFView.as_view(print_all_motions=False)


class Config(FormView):
    """The View for the config tab."""
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
    """Return the motion tab."""
    # TODO: Find a bether way to set the selected var.
    selected = request.path.startswith('/motion/')
    return Tab(
        title=_('Motions'),
        app='motion',
        url=reverse('motion_list'),
        permission=request.user.has_perm('motion.can_see_motion'),
        selected=selected,
    )


def get_widgets(request):
    """Return the motion widgets for the dashboard.

    There is only one widget. It shows all motions.
    """
    return [Widget(
        name='motions',
        display_name=_('Motions'),
        template='motion/widget.html',
        context={'motions': Motion.objects.all()},
        permission_required='projector.can_manage_projector')]
