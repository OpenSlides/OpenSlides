#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.views
    ~~~~~~~~~~~~~~~~~~~~~~~

    Views for the motion app.

    The views are automaticly imported from openslides.motion.urls.

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
from openslides.utils.utils import html_strong, htmldiff
from openslides.poll.views import PollFormView
from openslides.projector.api import get_active_slide
from openslides.projector.projector import Widget, SLIDE
from openslides.config.api import config
from openslides.agenda.models import Item

from .models import (Motion, MotionSubmitter, MotionSupporter, MotionPoll,
                     MotionVersion, State, WorkflowError, Category)
from .forms import (BaseMotionForm, MotionSubmitterMixin, MotionSupporterMixin,
                    MotionDisableVersioningMixin, MotionCategoryMixin,
                    MotionIdentifierMixin)
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
        context['min_supporters'] = int(config['motion_min_supporters'])
        return context

motion_detail = MotionDetailView.as_view()


class MotionMixin(object):
    """
    Mixin for MotionViewsClasses to save the version data.
    """

    def manipulate_object(self, form):
        """
        Save the version data into the motion object before it is saved in
        the Database.
        """
        super(MotionMixin, self).manipulate_object(form)
        for attr in ['title', 'text', 'reason']:
            setattr(self.object, attr, form.cleaned_data[attr])

        if type(self) != MotionCreateView:
            if self.object.state.versioning and form.cleaned_data.get('new_version', True):
                self.object.new_version

        try:
            self.object.category = form.cleaned_data['category']
        except KeyError:
            pass

        try:
            self.object.identifier = form.cleaned_data['identifier']
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
        form_classes = []

        if (self.request.user.has_perm('motion.can_manage_motion') and
                config['motion_identifier'] == 'manually'):
            form_classes.append(MotionIdentifierMixin)

        form_classes.append(BaseMotionForm)

        if self.request.user.has_perm('motion.can_manage_motion'):
            form_classes.append(MotionSubmitterMixin)
            form_classes.append(MotionCategoryMixin)
            if config['motion_min_supporters'] > 0:
                form_classes.append(MotionSupporterMixin)
        if self.object:
            if config['motion_allow_disable_versioning'] and self.object.state.versioning:
                form_classes.append(MotionDisableVersioningMixin)
        return type('MotionForm', tuple(form_classes), {})


class MotionCreateView(MotionMixin, CreateView):
    """View to create a motion."""
    model = Motion

    def has_permission(self, request, *args, **kwargs):
        """
        Checks whether the requesting user can submit a new motion. He needs
        at least the permission 'motion.can_create_motion'. If the submitting
        of new motions by non-staff users is stopped via config variable
        'motion_stop_submitting', the requesting user needs also to have
        'motion.can_manage_motion'.
        """
        if request.user.has_perm('motion.can_create_motion'):
            return not config['motion_stop_submitting'] or request.user.has_perm('motion.can_manage_motion')
        return False

    def form_valid(self, form):
        """Write a log message, if the form is valid."""
        value = super(MotionCreateView, self).form_valid(form)
        self.object.write_log(ugettext_noop('Motion created'), self.request.user)
        return value

    def post_save(self, form):
        super(MotionCreateView, self).post_save(form)
        if not 'submitter' in form.cleaned_data:
            self.object.add_submitter(self.request.user)

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
    """
    View to permit a version of a motion.
    """

    model = Motion
    question_url_name = 'motion_version_detail'
    success_url_name = 'motion_version_detail'
    success_message = ugettext_lazy('Version successfully permitted.')

    def get(self, *args, **kwargs):
        """
        Set self.object to a motion.
        """
        self.object = self.get_object()
        return super(VersionPermitView, self).get(*args, **kwargs)

    def get_url_name_args(self):
        """
        Return a list with arguments to create the success- and question_url.
        """
        return [self.object.pk, self.object.version.version_number]

    def get_question(self):
        """
        Return a string, shown to the user as question to permit the version.
        """
        return _('Are you sure you want permit Version %s?') % self.object.version.version_number

    def case_yes(self):
        """
        Activate the version, if the user chooses 'yes'.
        """
        self.object.set_active_version(self.object.version)  # TODO: Write log message
        self.object.save(no_new_version=True)

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
        self.object.reject_version(self.object.version)  # TODO: Write log message
        self.object.save()

version_reject = VersionRejectView.as_view()


class VersionDiffView(DetailView):
    """Show diff between two versions of a motion."""
    permission_required = 'motion.can_see_motion'
    model = Motion
    template_name = 'motion/motion_diff.html'

    def get_context_data(self, **kwargs):
        """Return the template context with versions and html diff strings."""
        try:
            rev1 = int(self.request.GET['rev1'])
            rev2 = int(self.request.GET['rev2'])
            version_rev1 = self.object.versions.get(version_number=self.request.GET['rev1'])
            version_rev2 = self.object.versions.get(version_number=self.request.GET['rev2'])
            diff_text = htmldiff(version_rev1.text, version_rev2.text)
            diff_reason = htmldiff(version_rev1.reason, version_rev2.reason)
        except (KeyError, ValueError, MotionVersion.DoesNotExist):
            messages.error(self.request, _('At least one version number was not valid.'))
            version_rev1 = None
            version_rev2 = None
            diff_text = None
            diff_reason = None
        context = super(VersionDiffView, self).get_context_data(**kwargs)
        context.update({
            'version_rev1': version_rev1,
            'version_rev2': version_rev2,
            'diff_text': diff_text,
            'diff_reason': diff_reason,
        })
        return context

version_diff = VersionDiffView.as_view()


class SetIdentifierView(SingleObjectMixin, RedirectView):
    """Set the identifier of the motion.

    See motion.set_identifier for more informations
    """
    permission_required = 'motion.can_manage_motion'
    model = Motion
    url_name = 'motion_detail'

    def get(self, request, *args, **kwargs):
        """Set self.object to a motion."""
        self.object = self.get_object()
        return super(SetIdentifierView, self).get(request, *args, **kwargs)

    def pre_redirect(self, request, *args, **kwargs):
        """Set the identifier."""
        self.object.set_identifier()

    def get_url_name_args(self):
        return [self.object.id]

set_identifier = SetIdentifierView.as_view()


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

        First the method checks the permissions, and writes a log message after
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

    def get_redirect_url(self, **kwargs):
        """Return the URL to the DetailView of the motion."""
        return reverse('motion_detail', args=[self.object.motion.pk])

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
                self.object.set_state(int(kwargs['state']))
        except WorkflowError, e:  # TODO: Is a WorkflowError still possible here?
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


class CategoryListView(ListView):
    permission_required = 'motion.can_manage_motion'
    model = Category

category_list = CategoryListView.as_view()


class CategoryCreateView(CreateView):
    permission_required = 'motion.can_manage_motion'
    model = Category
    success_url_name = 'motion_category_list'

category_create = CategoryCreateView.as_view()


class CategoryUpdateView(UpdateView):
    permission_required = 'motion.can_manage_motion'
    model = Category
    success_url_name = 'motion_category_list'

category_update = CategoryUpdateView.as_view()


class CategoryDeleteView(DeleteView):
    permission_required = 'motion.can_manage_motion'
    model = Category
    question_url_name = 'motion_category_list'
    success_url_name = 'motion_category_list'

category_delete = CategoryDeleteView.as_view()


def register_tab(request):
    """Return the motion tab."""
    # TODO: Find a better way to set the selected var.
    return Tab(
        title=_('Motions'),
        app='motion',
        url=reverse('motion_list'),
        permission=request.user.has_perm('motion.can_see_motion'),
        selected=request.path.startswith('/motion/'))


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
