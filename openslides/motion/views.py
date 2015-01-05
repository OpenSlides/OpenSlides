# -*- coding: utf-8 -*-

from django.contrib import messages
from django.core.urlresolvers import reverse
from django.http import Http404, HttpResponseRedirect
from django.utils.text import slugify
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy, ugettext_noop
from reportlab.platypus import SimpleDocTemplate
from django.shortcuts import get_object_or_404

from openslides.agenda.views import CreateRelatedAgendaItemView as _CreateRelatedAgendaItemView
from openslides.config.api import config
from openslides.poll.views import PollFormView
from openslides.projector.api import get_active_slide, update_projector
from openslides.utils.utils import html_strong, htmldiff
from openslides.utils.views import (CreateView, CSVImportView, DeleteView, DetailView,
                                    ListView, PDFView, QuestionView,
                                    RedirectView, SingleObjectMixin, UpdateView)

from .csv_import import import_motions
from .forms import (BaseMotionForm, MotionCategoryMixin,
                    MotionDisableVersioningMixin, MotionIdentifierMixin,
                    MotionCSVImportForm, MotionSubmitterMixin,
                    MotionSupporterMixin, MotionWorkflowMixin)
from .models import (Category, Motion, MotionPoll, MotionSubmitter,
                     MotionSupporter, MotionVersion, State)
from .pdf import motion_poll_to_pdf, motion_to_pdf, motions_to_pdf


class MotionListView(ListView):
    """
    View, to list all motions.
    """
    model = Motion
    required_permission = 'motion.can_see_motion'
    # The template name must be set explicitly because the overridden method
    # get_queryset() does not return a QuerySet any more so that Django can't
    # generate the template name from the name of the model.
    template_name = 'motion/motion_list.html'
    # The attribute context_object_name must be set explicitly because the
    # overridden method get_queryset() does not return a QuerySet any more so
    # that Django can't generate the context_object_name from the name of the
    # model.
    context_object_name = 'motion_list'

    def get_queryset(self, *args, **kwargs):
        """
        Returns not a QuerySet but a filtered list of motions. Excludes motions
        that the user is not allowed to see.
        """
        queryset = super(MotionListView, self).get_queryset(*args, **kwargs)
        motions = []
        for motion in queryset:
            if (not motion.state.required_permission_to_see or
                    self.request.user.has_perm(motion.state.required_permission_to_see)):
                motions.append(motion)
        return motions


class MotionDetailView(DetailView):
    """
    Show one motion.
    """
    model = Motion

    def check_permission(self, request, *args, **kwargs):
        """
        Check if the request.user has the permission to see the motion.
        """
        return self.get_object().get_allowed_actions(request.user)['see']

    def get_context_data(self, **kwargs):
        """
        Return the template context.

        Append the allowed actions for the motion, the shown version and its
        data to the context.
        """
        version_number = self.kwargs.get('version_number', None)
        if version_number is not None:
            try:
                version = self.get_object().versions.get(version_number=int(version_number))
            except MotionVersion.DoesNotExist:
                raise Http404('Version %s not found' % version_number)
        else:
            version = self.get_object().get_active_version()

        kwargs.update({
            'allowed_actions': self.get_object().get_allowed_actions(self.request.user),
            'version': version,
            'title': version.title,
            'text': version.text,
            'reason': version.reason})
        return super(MotionDetailView, self).get_context_data(**kwargs)


class MotionEditMixin(object):
    """
    Mixin for motion views classes to save the version data.
    """

    def form_valid(self, form):
        """
        Saves the CreateForm or UpdateForm into a motion object.
        """
        self.object = form.save(commit=False)

        try:
            self.object.category = form.cleaned_data['category']
        except KeyError:
            pass

        try:
            self.object.identifier = form.cleaned_data['identifier']
        except KeyError:
            pass

        self.manipulate_object(form)

        for attr in ['title', 'text', 'reason']:
            setattr(self.version, attr, form.cleaned_data[attr])

        self.object.save(use_version=self.version)

        # Save the submitter an the supporter so the motion.
        # TODO: Only delete and save neccessary submitters and supporters
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

        # Save the attachments
        self.object.attachments.clear()
        self.object.attachments.add(*form.cleaned_data['attachments'])

        # Save the tags
        self.object.tags.clear()
        self.object.tags.add(*form.cleaned_data['tags'])

        # Update the projector if the motion is on it. This can not be done in
        # the model, because bulk_create does not call the save method.
        active_slide = get_active_slide()
        active_slide_pk = active_slide.get('pk', None)
        if (active_slide['callback'] == 'motion' and
                unicode(self.object.pk) == unicode(active_slide_pk)):
            update_projector()

        messages.success(self.request, self.get_success_message())
        return HttpResponseRedirect(self.get_success_url())

    def get_form_class(self):
        """
        Return the FormClass to create or update the motion.

        forms.BaseMotionForm is the base for the Class, and some FormMixins
        will be mixed in dependence of some config values. See motion.forms
        for more information on the mixins.
        """
        form_classes = []

        if (self.request.user.has_perm('motion.can_manage_motion') and
                (config['motion_identifier'] == 'manually' or type(self) == MotionUpdateView)):
            form_classes.append(MotionIdentifierMixin)

        form_classes.append(BaseMotionForm)

        if self.request.user.has_perm('motion.can_manage_motion'):
            form_classes.append(MotionSubmitterMixin)
            form_classes.append(MotionCategoryMixin)
            if config['motion_min_supporters'] > 0:
                form_classes.append(MotionSupporterMixin)
            form_classes.append(MotionWorkflowMixin)

        if self.object:
            if config['motion_allow_disable_versioning'] and self.object.state.versioning:
                form_classes.append(MotionDisableVersioningMixin)

        return type('MotionForm', tuple(form_classes), {})


class MotionCreateView(MotionEditMixin, CreateView):
    """
    View to create a motion.
    """
    model = Motion

    def check_permission(self, request, *args, **kwargs):
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
        """
        Write a log message and set the submitter if necessary.
        """
        # First, validate and process the form and create the motion
        response = super(MotionCreateView, self).form_valid(form)

        # Write the log message
        self.object.write_log([ugettext_noop('Motion created')], self.request.user)

        # Set submitter to request.user if no submitter is set yet
        if ('submitter' not in form.cleaned_data or
                not form.cleaned_data['submitter']):
            self.object.add_submitter(self.request.user)
        return response

    def get_initial(self):
        """
        Sets the initial data for the MotionCreateForm.
        """
        initial = super(MotionCreateView, self).get_initial()
        initial['text'] = config['motion_preamble']
        if self.request.user.has_perm('motion.can_manage_motion'):
            initial['workflow'] = config['motion_workflow']
        return initial

    def manipulate_object(self, form):
        """
        Sets first state according to given or default workflow and initiates
        a new version.
        """
        workflow = form.cleaned_data.get('workflow', int(config['motion_workflow']))
        self.object.reset_state(workflow)
        self.version = self.object.get_new_version()


class MotionCreateAmendmentView(MotionCreateView):
    """
    Create an amendment.
    """

    def dispatch(self, *args, **kwargs):
        if not config['motion_amendments_enabled']:
            raise Http404('Amendments are disabled in the config.')
        return super(MotionCreateAmendmentView, self).dispatch(*args, **kwargs)

    def get_parent_motion(self):
        """
        Gets the parent motion from the url.

        Caches the value.
        """
        try:
            parent = self._object_parent
        except AttributeError:
            # self.get_object() is the django method, which does not cache the
            # object. For now this is not a problem, because get_object() is only
            # called once.
            parent = self._object_parent = self.get_object()
        return parent

    def manipulate_object(self, form):
        """
        Sets the parent to the motion to which this amendment refers.
        """
        self.object.parent = self.get_parent_motion()
        super(MotionCreateAmendmentView, self).manipulate_object(form)

    def get_initial(self):
        """
        Sets the initial values to the form.

        This are the values for title, text and reason which are set to the
        values from the parent motion.
        """
        initial = super(MotionCreateAmendmentView, self).get_initial()
        parent = self.get_parent_motion()
        initial['title'] = parent.title
        initial['text'] = parent.text
        initial['reason'] = parent.reason
        initial['category'] = parent.category
        return initial


class MotionUpdateView(MotionEditMixin, UpdateView):
    """
    View to update a motion.
    """
    model = Motion

    def check_permission(self, request, *args, **kwargs):
        """
        Check if the request.user has the permission to edit the motion.
        """
        return self.get_object().get_allowed_actions(request.user)['update']

    def form_valid(self, form):
        """
        Writes a log message and removes supports in some cases if the form is valid.
        """
        response = super(MotionUpdateView, self).form_valid(form)
        self.write_log()
        if (config['motion_remove_supporters'] and self.object.state.allow_support and
                not self.request.user.has_perm('motion.can_manage_motion')):
            self.object.clear_supporters()
            self.object.write_log([ugettext_noop('All supporters removed')], self.request.user)
        return response

    def write_log(self):
        """
        Writes a log message. Distinguishs whether a version was created or updated.
        """
        if self.version.id is None:
            number = self.object.get_last_version().version_number
            created = False
        else:
            number = self.version.version_number
            created = self.used_new_version
        self.object.write_log(
            [ugettext_noop('Motion version'),
             ' %d ' % number,
             ugettext_noop('created') if created else ugettext_noop('updated')],
            self.request.user)

    def get_initial(self):
        initial = super(MotionUpdateView, self).get_initial()
        if self.request.user.has_perm('motion.can_manage_motion'):
            initial['workflow'] = self.object.state.workflow
        return initial

    def manipulate_object(self, form):
        """
        Resets state if the workflow should change and decides whether to use a
        new version or the last version.
        """
        workflow = form.cleaned_data.get('workflow', None)
        if (workflow is not None and
                workflow != self.object.state.workflow):
            self.object.reset_state(workflow)

        # Decide if a new version is saved to the database
        if (self.object.state.versioning and
                not form.cleaned_data.get('disable_versioning', False)):
            self.version = self.object.get_new_version()
            self.used_new_version = True
        else:
            self.version = self.object.get_last_version()
            self.used_new_version = False


class MotionDeleteView(DeleteView):
    """
    View to delete a motion.
    """
    model = Motion
    success_url_name = 'motion_list'

    def check_permission(self, request, *args, **kwargs):
        """
        Check if the request.user has the permission to delete the motion.
        """
        return self.get_object().get_allowed_actions(request.user)['delete']

    def get_final_message(self):
        return _('%s was successfully deleted.') % _('Motion')


class VersionDeleteView(DeleteView):
    """
    View to delete a motion version.
    """
    model = MotionVersion
    required_permission = 'motion.can_manage_motion'
    success_url_name = 'motion_detail'

    def get_object(self):
        try:
            version = self._object
        except AttributeError:
            try:
                motion = Motion.objects.get(pk=int(self.kwargs.get('pk')))
            except Motion.DoesNotExist:
                raise Http404('Motion %s not found.' % self.kwargs.get('pk'))
            try:
                version = MotionVersion.objects.get(
                    motion=motion,
                    version_number=int(self.kwargs.get('version_number')))
            except MotionVersion.DoesNotExist:
                raise Http404('Version %s not found.' % self.kwargs.get('version_number'))
            if version == motion.active_version:
                raise Http404('You can not delete the active version of a motion.')
            self._object = version
        return version

    def get_url_name_args(self):
        return (self.get_object().motion_id, )


class VersionPermitView(SingleObjectMixin, QuestionView):
    """
    View to permit a version of a motion.
    """
    model = Motion
    final_message = ugettext_lazy('Version successfully permitted.')
    required_permission = 'motion.can_manage_motion'
    question_url_name = 'motion_version_detail'

    def get(self, *args, **kwargs):
        """
        Sets self.version to a motion version.
        """
        version_number = self.kwargs.get('version_number', None)
        try:
            self.version = self.get_object().versions.get(version_number=int(version_number))
        except MotionVersion.DoesNotExist:
            raise Http404('Version %s not found.' % version_number)
        return super(VersionPermitView, self).get(*args, **kwargs)

    def get_url_name_args(self):
        """
        Returns a list with arguments to create the success- and question_url.
        """
        return [self.get_object().pk, self.version.version_number]

    def get_question_message(self):
        """
        Return a string, shown to the user as question to permit the version.
        """
        return _('Are you sure you want permit version %s?') % self.version.version_number

    def on_clicked_yes(self):
        """
        Activate the version, if the user chooses 'yes'.
        """
        self.get_object().active_version = self.version
        self.get_object().save(update_fields=['active_version'])
        self.get_object().write_log(
            message_list=[ugettext_noop('Version'),
                          ' %d ' % self.version.version_number,
                          ugettext_noop('permitted')],
            person=self.request.user)


class VersionDiffView(DetailView):
    """
    Show diff between two versions of a motion.
    """
    model = Motion
    template_name = 'motion/motion_diff.html'

    def check_permission(self, request, *args, **kwargs):
        """
        Check if the request.user has the permission to see the motion.
        """
        return self.get_object().get_allowed_actions(request.user)['see']

    def get_context_data(self, **kwargs):
        """
        Return the template context with versions and html diff strings.
        """
        try:
            rev1 = int(self.request.GET['rev1'])
            rev2 = int(self.request.GET['rev2'])
            version_rev1 = self.get_object().versions.get(version_number=rev1)
            version_rev2 = self.get_object().versions.get(version_number=rev2)
            diff_text = htmldiff(version_rev1.text, version_rev2.text)
            diff_reason = htmldiff(version_rev1.reason, version_rev2.reason)
        except (KeyError, ValueError, MotionVersion.DoesNotExist):
            messages.error(self.request, _('At least one version number is not valid.'))
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


class SupportView(SingleObjectMixin, QuestionView):
    """
    View to support or unsupport a motion.

    If self.support is True, the view will append a request.user to the supporter list.

    If self.support is False, the view will remove a request.user from the supporter list.
    """

    required_permission = 'motion.can_support_motion'
    model = Motion
    support = True

    def check_permission(self, request):
        """
        Return True if the user can support or unsupport the motion. Else: False.
        """
        allowed_actions = self.get_object().get_allowed_actions(request.user)
        if self.support and not allowed_actions['support']:
            messages.error(request, _('You can not support this motion.'))
            return False
        elif not self.support and not allowed_actions['unsupport']:
            messages.error(request, _('You can not unsupport this motion.'))
            return False
        else:
            return True

    def get_question_message(self):
        """
        Return the question string.
        """
        if self.support:
            return _('Do you really want to support this motion?')
        else:
            return _('Do you really want to unsupport this motion?')

    def on_clicked_yes(self):
        """
        Append or remove the request.user from the motion.

        First the method checks the permissions, and writes a log message after
        appending or removing the user.
        """
        if self.check_permission(self.request):
            user = self.request.user
            if self.support:
                self.get_object().support(person=user)
                self.get_object().write_log([ugettext_noop('Motion supported')], user)
            else:
                self.get_object().unsupport(person=user)
                self.get_object().write_log([ugettext_noop('Motion unsupported')], user)

    def get_final_message(self):
        """
        Return the success message.
        """
        if self.support:
            return _("You have supported this motion successfully.")
        else:
            return _("You have unsupported this motion successfully.")


class PollCreateView(SingleObjectMixin, RedirectView):
    """
    View to create a poll for a motion.
    """
    required_permission = 'motion.can_manage_motion'
    model = Motion
    url_name = 'motionpoll_detail'

    def pre_redirect(self, request, *args, **kwargs):
        """
        Create the poll for the motion.
        """
        self.poll = self.get_object().create_poll()
        self.get_object().write_log([ugettext_noop("Poll created")], request.user)
        messages.success(request, _("New vote was successfully created."))

    def get_redirect_url(self, **kwargs):
        """
        Return the URL to the UpdateView of the poll.
        """
        return reverse('motionpoll_update', args=[self.get_object().pk, self.poll.poll_number])


class PollMixin(object):
    """
    Mixin for the PollUpdateView and the PollDeleteView.
    """

    required_permission = 'motion.can_manage_motion'
    success_url_name = 'motion_detail'

    def get_object(self):
        """
        Return a MotionPoll object.

        Use the motion id and the poll_number from the url kwargs to get the
        object.
        """
        try:
            obj = self._object
        except AttributeError:
            queryset = MotionPoll.objects.filter(
                motion=self.kwargs['pk'],
                poll_number=self.kwargs['poll_number'])
            obj = get_object_or_404(queryset)
            self._object = obj
        return obj

    def get_url_name_args(self):
        """
        Return the arguments to create the url to the success_url.
        """
        return [self.get_object().motion.pk]


class PollUpdateView(PollMixin, PollFormView):
    """
    View to update a MotionPoll.
    """

    poll_class = MotionPoll
    """
    Poll Class to use for this view.
    """

    template_name = 'motion/motionpoll_form.html'

    def get_context_data(self, **kwargs):
        """
        Return the template context.

        Append the motion object to the context.
        """
        context = super(PollUpdateView, self).get_context_data(**kwargs)
        context.update({
            'motion': self.poll.motion,
            'poll': self.poll})
        return context

    def form_valid(self, form):
        """
        Write a log message, if the form is valid.
        """
        value = super(PollUpdateView, self).form_valid(form)
        self.get_object().write_log([ugettext_noop('Poll updated')], self.request.user)
        return value


class PollDeleteView(PollMixin, DeleteView):
    """
    View to delete a MotionPoll.
    """

    model = MotionPoll

    def on_clicked_yes(self):
        """
        Write a log message, if the form is valid.
        """
        super(PollDeleteView, self).on_clicked_yes()
        self.get_object().motion.write_log([ugettext_noop('Poll deleted')], self.request.user)

    def get_redirect_url(self, **kwargs):
        """
        Return the URL to the DetailView of the motion.
        """
        return reverse('motion_detail', args=[self.get_object().motion.pk])


class PollPDFView(PollMixin, PDFView):
    """
    Generates a ballotpaper.
    """

    required_permission = 'motion.can_manage_motion'
    top_space = 0

    def get_filename(self):
        """
        Return the filename for the PDF.
        """
        return u'%s%s_%s' % (_("Motion"), str(self.get_object().poll_number), _("Poll"))

    def get_template(self, buffer):
        return SimpleDocTemplate(
            buffer, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0,
            showBoundary=False)

    def build_document(self, pdf_document, story):
        pdf_document.build(story)

    def append_to_pdf(self, pdf):
        """
        Append PDF objects.
        """
        motion_poll_to_pdf(pdf, self.get_object())


class MotionSetStateView(SingleObjectMixin, RedirectView):
    """
    View to set the state of a motion.

    If self.reset is False, the new state is taken from url.
    If self.reset is True, the default state is taken.
    """
    required_permission = 'motion.can_manage_motion'
    url_name = 'motion_detail'
    model = Motion
    reset = False

    def pre_redirect(self, request, *args, **kwargs):
        """
        Save the new state and write a log message.
        """
        success = False
        if self.reset:
            self.get_object().reset_state()
            success = True
        elif self.get_object().state.id == int(kwargs['state']):
            messages.error(request, _('You can not set the state of the motion. It is already done.'))
        elif int(kwargs['state']) not in [state.id for state in self.get_object().state.next_states.all()]:
            messages.error(request, _('You can not set the state of the motion to %s.') % _(State.objects.get(pk=int(kwargs['state'])).name))
        else:
            self.get_object().set_state(int(kwargs['state']))
            success = True
        if success:
            self.get_object().save(update_fields=['state', 'identifier'])
            self.get_object().write_log(
                message_list=[ugettext_noop('State changed to'), ' ', self.get_object().state.name],  # TODO: Change string to 'State set to ...'
                person=self.request.user)
            messages.success(request,
                             _('The state of the motion was set to %s.')
                             % html_strong(_(self.get_object().state.name)))


class CreateRelatedAgendaItemView(_CreateRelatedAgendaItemView):
    """
    View to create and agenda item for a motion.
    """
    model = Motion

    def pre_redirect(self, request, *args, **kwargs):
        """
        Create the agenda item.
        """
        super(CreateRelatedAgendaItemView, self).pre_redirect(request, *args, **kwargs)
        self.get_object().write_log([ugettext_noop('Agenda item created')], self.request.user)


class MotionPDFView(SingleObjectMixin, PDFView):
    """
    Create the PDF for one or for all motions.

    If self.print_all_motions is True, the view returns a PDF with all motions.

    If self.print_all_motions is False, the view returns a PDF with only one
    motion.
    """
    model = Motion
    top_space = 0
    print_all_motions = False

    def check_permission(self, request, *args, **kwargs):
        """
        Checks if the requesting user has the permission to see the motion as
        PDF.
        """
        if self.print_all_motions:
            is_allowed = request.user.has_perm('motion.can_see_motion')
        else:
            is_allowed = self.get_object().get_allowed_actions(request.user)['see']
        return is_allowed

    def get_object(self, *args, **kwargs):
        if self.print_all_motions:
            obj = None
        else:
            obj = super(MotionPDFView, self).get_object(*args, **kwargs)
        return obj

    def get_filename(self):
        """
        Return the filename for the PDF.
        """
        if self.print_all_motions:
            return _("Motions")
        else:
            if self.get_object().identifier:
                suffix = self.get_object().identifier.replace(' ', '')
            else:
                suffix = self.get_object().title.replace(' ', '_')
                suffix = slugify(suffix)
            return '%s-%s' % (_("Motion"), suffix)

    def append_to_pdf(self, pdf):
        """
        Append PDF objects.
        """
        if self.print_all_motions:
            motions = []
            for motion in Motion.objects.all():
                if (not motion.state.required_permission_to_see or
                        self.request.user.has_perm(motion.state.required_permission_to_see)):
                    motions.append(motion)
            motions_to_pdf(pdf, motions)
        else:
            motion_to_pdf(pdf, self.get_object())


class CategoryListView(ListView):
    required_permission = 'motion.can_manage_motion'
    model = Category


class CategoryCreateView(CreateView):
    required_permission = 'motion.can_manage_motion'
    model = Category
    success_url_name = 'motion_category_list'
    url_name_args = []


class CategoryUpdateView(UpdateView):
    required_permission = 'motion.can_manage_motion'
    model = Category
    success_url_name = 'motion_category_list'
    url_name_args = []


class CategoryDeleteView(DeleteView):
    required_permission = 'motion.can_manage_motion'
    model = Category
    question_url_name = 'motion_category_list'
    url_name_args = []
    success_url_name = 'motion_category_list'


class MotionCSVImportView(CSVImportView):
    """
    Imports motions from an uploaded csv file.
    """
    form_class = MotionCSVImportForm
    required_permission = 'motion.can_manage_motion'
    success_url_name = 'motion_list'
    template_name = 'motion/motion_form_csv_import.html'

    def get_initial(self, *args, **kwargs):
        """
        Sets the request user as initial for the default submitter.
        """
        return_value = super(MotionCSVImportView, self).get_initial(*args, **kwargs)
        return_value.update({'default_submitter': self.request.user.person_id})
        return return_value

    def form_valid(self, form):
        success, warning, error = import_motions(importing_person=self.request.user, **form.cleaned_data)
        messages.success(self.request, success)
        messages.warning(self.request, warning)
        messages.error(self.request, error)
        # Overleap method of CSVImportView
        return super(CSVImportView, self).form_valid(form)
