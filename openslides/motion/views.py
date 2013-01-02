#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the motion app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

# for python 2.5 support
from __future__ import with_statement

import csv
import os

try:
    from urlparse import parse_qs
except ImportError:  # python <= 2.5
    from cgi import parse_qs

from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, PageBreak, Paragraph, Spacer, Table, TableStyle)

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.db import transaction
from django.shortcuts import redirect
from django.utils.translation import ugettext as _, ungettext

from openslides.utils import csv_ext
from openslides.utils.pdf import stylesheet
from openslides.utils.template import Tab
from openslides.utils.utils import (
    template, permission_required, del_confirm_form, gen_confirm_form)
from openslides.utils.views import (
    PDFView, RedirectView, DeleteView, FormView, SingleObjectMixin,
    QuestionMixin)
from openslides.utils.person import get_person
from openslides.config.models import config
from openslides.projector.projector import Widget
from openslides.poll.views import PollFormView
from openslides.participant.api import gen_username, gen_password
from openslides.participant.models import User, Group
from openslides.agenda.models import Item
from openslides.motion.models import Motion, AVersion, MotionPoll
from openslides.motion.forms import (
    MotionForm, MotionFormTrivialChanges, MotionManagerForm,
    MotionManagerFormSupporter, MotionImportForm, ConfigForm)


@permission_required('motion.can_see_motion')
@template('motion/overview.html')
def overview(request):
    """
    View all motions
    """
    try:
        sortfilter = parse_qs(request.COOKIES['votecollector_sortfilter'])
        for value in sortfilter:
            sortfilter[value] = sortfilter[value][0]
    except KeyError:
        sortfilter = {}

    for value in [u'sort', u'reverse', u'number', u'status', u'needsup', u'statusvalue']:
        if value in request.REQUEST:
            if request.REQUEST[value] == '0':
                try:
                    del sortfilter[value]
                except KeyError:
                    pass
            else:
                sortfilter[value] = request.REQUEST[value]

    query = Motion.objects.all()
    if 'number' in sortfilter:
        query = query.filter(number=None)
    if 'status' in sortfilter:
        if 'statusvalue' in sortfilter and 'on' in sortfilter['status']:
            query = query.filter(status__iexact=sortfilter['statusvalue'])

    if 'sort' in sortfilter:
        if sortfilter['sort'] == 'title':
            sort = 'aversion__title'
        elif sortfilter['sort'] == 'time':
            sort = 'aversion__time'
        else:
            sort = sortfilter['sort']
        query = query.order_by(sort)
        if sort.startswith('aversion_'):
            # limit result to last version of an motion
            query = query.filter(aversion__id__in=[x.last_version.id for x in Motion.objects.all()])

    if 'reverse' in sortfilter:
        query = query.reverse()

    # todo: rewrite this with a .filter()
    if 'needsup' in sortfilter:
        motions = []
        for motion in query.all():
            if not motion.enough_supporters:
                motions.append(motion)
    else:
        motions = query

    if type(motions) is not list:
        motions = list(query.all())

    # not the most efficient way to do this but 'get_allowed_actions'
    # is not callable from within djangos templates..
    for (i, motion) in enumerate(motions):
        try:
            motions[i] = {
                'actions': motion.get_allowed_actions(request.user),
                'motion': motion
            }
        except:
            # todo: except what?
            motions[i] = {
                'actions': [],
                'motion': motion
            }

    return {
        'motions': motions,
        'min_supporters': int(config['motion_min_supporters']),
    }


@permission_required('motion.can_see_motion')
@template('motion/view.html')
def view(request, motion_id, newest=False):
    """
    View one motion.
    """
    motion = Motion.objects.get(pk=motion_id)
    if newest:
        version = motion.last_version
    else:
        version = motion.public_version
    revisions = motion.versions
    actions = motion.get_allowed_actions(user=request.user)

    return {
        'motion': motion,
        'revisions': revisions,
        'actions': actions,
        'min_supporters': int(config['motion_min_supporters']),
        'version': version,
        #'results': motion.results
    }


@login_required
@template('motion/edit.html')
def edit(request, motion_id=None):
    """
    View a form to edit or create a motion.
    """
    if request.user.has_perm('motion.can_manage_motion'):
        is_manager = True
    else:
        is_manager = False

    if not is_manager \
    and not request.user.has_perm('motion.can_create_motion'):
        messages.error(request, _("You have not the necessary rights to create or edit motions."))
        return redirect(reverse('motion_overview'))
    if motion_id is not None:
        motion = Motion.objects.get(id=motion_id)
        if not 'edit' in motion.get_allowed_actions(request.user):
            messages.error(request, _("You can not edit this motion."))
            return redirect(reverse('motion_view', args=[motion.id]))
        actions = motion.get_allowed_actions(user=request.user)
    else:
        motion = None
        actions = None

    formclass = MotionFormTrivialChanges \
        if config['motion_allow_trivial_change'] and motion_id \
        else MotionForm

    managerformclass = MotionManagerFormSupporter \
                       if config['motion_min_supporters'] \
                       else MotionManagerForm

    if request.method == 'POST':
        dataform = formclass(request.POST, prefix="data")
        valid = dataform.is_valid()

        if is_manager:
            managerform = managerformclass(request.POST,
                            instance=motion,
                            prefix="manager")
            valid = valid and managerform.is_valid()
        else:
            managerform = None

        if valid:
            if is_manager:
                motion = managerform.save(commit=False)
            elif motion_id is None:
                motion = Motion(submitter=request.user)
            motion.title = dataform.cleaned_data['title']
            motion.text = dataform.cleaned_data['text']
            motion.reason = dataform.cleaned_data['reason']

            try:
                trivial_change = config['motion_allow_trivial_change'] \
                    and dataform.cleaned_data['trivial_change']
            except KeyError:
                trivial_change = False
            motion.save(request.user, trivial_change=trivial_change)
            if is_manager:
                try:
                    new_supporters = set(managerform.cleaned_data['supporter'])
                except KeyError:
                    # The managerform has no field for the supporters
                    pass
                else:
                    old_supporters = set(motion.supporters)
                    # add new supporters
                    for supporter in new_supporters.difference(old_supporters):
                        motion.support(supporter)
                    # remove old supporters
                    for supporter in old_supporters.difference(new_supporters):
                        motion.unsupport(supporter)

            if motion_id is None:
                messages.success(request, _('New motion was successfully created.'))
            else:
                messages.success(request, _('Motion was successfully modified.'))

            if not 'apply' in request.POST:
                return redirect(reverse('motion_view', args=[motion.id]))
            if motion_id is None:
                return redirect(reverse('motion_edit', args=[motion.id]))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        if motion_id is None:
            initial = {'text': config['motion_preamble']}
        else:
            if motion.status == "pub" and motion.supporters:
                if request.user.has_perm('motion.can_manage_motion'):
                    messages.warning(request, _("Attention: Do you really want to edit this motion? The supporters will <b>not</b> be removed automatically because you can manage motions. Please check if the supports are valid after your changing!"))
                else:
                    messages.warning(request, _("Attention: Do you really want to edit this motion? All <b>%s</b> supporters will be removed! Try to convince the supporters again.") % motion.count_supporters() )
            initial = {'title': motion.title,
                       'text': motion.text,
                       'reason': motion.reason}

        dataform = formclass(initial=initial, prefix="data")
        if is_manager:
            if motion_id is None:
                initial = {'submitter': request.user.person_id}
            else:
                initial = {'submitter': motion.submitter.person_id,
                    'supporter': [supporter.person_id for supporter in motion.supporters]}
            managerform = managerformclass(initial=initial,
                instance=motion, prefix="manager")
        else:
            managerform = None
    return {
        'form': dataform,
        'managerform': managerform,
        'motion': motion,
        'actions': actions,
    }


@permission_required('motion.can_manage_motion')
@template('motion/view.html')
def set_number(request, motion_id):
    """
    set a number for an motion.
    """
    try:
        Motion.objects.get(pk=motion_id).set_number(user=request.user)
        messages.success(request, _("Motion number was successfully set."))
    except Motion.DoesNotExist:
        pass
    except NameError:
        pass
    return redirect(reverse('motion_view', args=[motion_id]))


@permission_required('motion.can_manage_motion')
@template('motion/view.html')
def permit(request, motion_id):
    """
    permit an motion.
    """
    try:
        Motion.objects.get(pk=motion_id).permit(user=request.user)
        messages.success(request, _("Motion was successfully authorized."))
    except Motion.DoesNotExist:
        pass
    except NameError, e:
        messages.error(request, e)
    return redirect(reverse('motion_view', args=[motion_id]))

@permission_required('motion.can_manage_motion')
@template('motion/view.html')
def notpermit(request, motion_id):
    """
    reject (not permit) an motion.
    """
    try:
        Motion.objects.get(pk=motion_id).notpermit(user=request.user)
        messages.success(request, _("Motion was successfully rejected."))
    except Motion.DoesNotExist:
        pass
    except NameError, e:
        messages.error(request, e)
    return redirect(reverse('motion_view', args=[motion_id]))

@template('motion/view.html')
def set_status(request, motion_id=None, status=None):
    """
    set a status of an motion.
    """
    try:
        if status is not None:
            motion = Motion.objects.get(pk=motion_id)
            motion.set_status(user=request.user, status=status)
            messages.success(request, _("Motion status was set to: <b>%s</b>.") % motion.get_status_display())
    except Motion.DoesNotExist:
        pass
    except NameError, e:
        messages.error(request, e)
    return redirect(reverse('motion_view', args=[motion_id]))


@permission_required('motion.can_manage_motion')
@template('motion/view.html')
def reset(request, motion_id):
    """
    reset an motion.
    """
    try:
        Motion.objects.get(pk=motion_id).reset(user=request.user)
        messages.success(request, _("Motion status was reset.") )
    except Motion.DoesNotExist:
        pass
    return redirect(reverse('motion_view', args=[motion_id]))


class SupportView(SingleObjectMixin, QuestionMixin, RedirectView):
    """
    Classed based view to support or unsupport a motion. Use
    support=True or support=False in urls.py
    """
    permission_required = 'motion.can_support_motion'
    model = Motion
    pk_url_kwarg = 'motion_id'
    support = True

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        return super(SupportView, self).get(request, *args, **kwargs)

    def check_allowed_actions(self, request):
        """
        Checks whether request.user can support or unsupport the motion.
        Returns True or False.
        """
        allowed_actions = self.object.get_allowed_actions(request.user)
        if self.support and not 'support' in allowed_actions:
            messages.error(request, _('You can not support this motion.'))
            return False
        elif not self.support and not 'unsupport' in allowed_actions:
            messages.error(request, _('You can not unsupport this motion.'))
            return False
        else:
            return True

    def pre_redirect(self, request, *args, **kwargs):
        if self.check_allowed_actions(request):
            super(SupportView, self).pre_redirect(request, *args, **kwargs)

    def get_question(self):
        if self.support:
            return _('Do you really want to support this motion?')
        else:
            return _('Do you really want to unsupport this motion?')

    def case_yes(self):
        if self.check_allowed_actions(self.request):
            if self.support:
                self.object.support(person=self.request.user)
            else:
                self.object.unsupport(person=self.request.user)

    def get_success_message(self):
        if self.support:
            return _("You have supported this motion successfully.")
        else:
            return _("You have unsupported this motion successfully.")

    def get_redirect_url(self, **kwargs):
        return reverse('motion_view', args=[kwargs[self.pk_url_kwarg]])


@permission_required('motion.can_manage_motion')
@template('motion/view.html')
def gen_poll(request, motion_id):
    """
    gen a poll for this motion.
    """
    try:
        poll = Motion.objects.get(pk=motion_id).gen_poll(user=request.user)
        messages.success(request, _("New vote was successfully created.") )
    except Motion.DoesNotExist:
        pass # TODO: do not call poll after this excaption
    return redirect(reverse('motion_poll_view', args=[poll.id]))


@permission_required('motion.can_manage_motion')
def delete_poll(request, poll_id):
    """
    delete a poll from this motion
    """
    poll = MotionPoll.objects.get(pk=poll_id)
    motion = poll.motion
    count = motion.polls.filter(id__lte=poll_id).count()
    if request.method == 'POST':
        poll.delete()
        motion.writelog(_("Poll deleted"), request.user)
        messages.success(request, _('Poll was successfully deleted.'))
    else:
        del_confirm_form(request, poll, name=_("the %s. poll") % count, delete_link=reverse('motion_poll_delete', args=[poll_id]))
    return redirect(reverse('motion_view', args=[motion.id]))


class MotionDelete(DeleteView):
    """
    Delete one or more Motions.
    """
    model = Motion
    url = 'motion_overview'

    def has_permission(self, request, *args, **kwargs):
        self.kwargs = kwargs
        return self.get_object().get_allowed_actions(request.user)

    def get_object(self):
        self.motions = []

        if self.kwargs.get('motion_id', None):
            try:
                return Motion.objects.get(id=int(self.kwargs['motion_id']))
            except Motion.DoesNotExist:
                return None

        if self.kwargs.get('motion_ids', []):
            for appid in self.kwargs['motion_ids']:
                try:
                    self.motions.append(Motion.objects.get(id=int(appid)))
                except Motion.DoesNotExist:
                    pass

            if self.motions:
                return self.motions[0]
        return None

    def pre_post_redirect(self, request, *args, **kwargs):
        self.object = self.get_object()

        if len(self.motions):
            for motion in self.motions:
                if not 'delete' in motion.get_allowed_actions(user=request.user):
                    messages.error(request, _("You can not delete motion <b>%s</b>.") % motion)
                    continue

                title = motion.title
                motion.delete(force=True)
                messages.success(request, _("Motion <b>%s</b> was successfully deleted.") % title)

        elif self.object:
            if not 'delete' in self.object.get_allowed_actions(user=request.user):
                messages.error(request, _("You can not delete motion <b>%s</b>.") % self.object)
            elif self.get_answer() == 'yes':
                title = self.object.title
                self.object.delete(force=True)
                messages.success(request, _("Motion <b>%s</b> was successfully deleted.") % title)
        else:
            messages.error(request, _("Invalid request"))


class ViewPoll(PollFormView):
    permission_required = 'motion.can_manage_motion'
    poll_class = MotionPoll
    template_name = 'motion/poll_view.html'

    def get_context_data(self, **kwargs):
        context = super(ViewPoll, self).get_context_data(**kwargs)
        self.motion = self.poll.get_motion()
        context['motion'] = self.motion
        context['ballot'] = self.poll.get_ballot()
        context['actions'] = self.motion.get_allowed_actions(user=self.request.user)
        return context

    def get_modelform_class(self):
        cls = super(ViewPoll, self).get_modelform_class()
        user = self.request.user

        class ViewPollFormClass(cls):
            def save(self, commit = True):
                instance = super(ViewPollFormClass, self).save(commit)
                motion = instance.motion
                motion.writelog(_("Poll was updated"), user)
                return instance

        return ViewPollFormClass

    def get_success_url(self):
        if not 'apply' in self.request.POST:
            return reverse('motion_view', args=[self.poll.motion.id])
        return ''


@permission_required('motion.can_manage_motion')
def permit_version(request, aversion_id):
    aversion = AVersion.objects.get(pk=aversion_id)
    motion = aversion.motion
    if request.method == 'POST':
        motion.accept_version(aversion, user=request.user)
        messages.success(request, _("Version <b>%s</b> accepted.") % (aversion.aid))
    else:
        gen_confirm_form(request, _('Do you really want to authorize version <b>%s</b>?') % aversion.aid, reverse('motion_version_permit', args=[aversion.id]))
    return redirect(reverse('motion_view', args=[motion.id]))


@permission_required('motion.can_manage_motion')
def reject_version(request, aversion_id):
    aversion = AVersion.objects.get(pk=aversion_id)
    motion = aversion.motion
    if request.method == 'POST':
        if motion.reject_version(aversion, user=request.user):
            messages.success(request, _("Version <b>%s</b> rejected.") % (aversion.aid))
        else:
            messages.error(request, _("ERROR by rejecting the version.") )
    else:
        gen_confirm_form(request, _('Do you really want to reject version <b>%s</b>?') % aversion.aid, reverse('motion_version_reject', args=[aversion.id]))
    return redirect(reverse('motion_view', args=[motion.id]))


@permission_required('motion.can_manage_motion')
@template('motion/import.html')
def motion_import(request):
    if request.method == 'POST':
        form = MotionImportForm(request.POST, request.FILES)
        if form.is_valid():
            import_permitted = form.cleaned_data['import_permitted']
            try:
                # check for valid encoding (will raise UnicodeDecodeError if not)
                request.FILES['csvfile'].read().decode('utf-8')
                request.FILES['csvfile'].seek(0)

                users_generated = 0
                motions_generated = 0
                motions_modified = 0
                groups_assigned = 0
                groups_generated = 0
                with transaction.commit_on_success():
                    dialect = csv.Sniffer().sniff(request.FILES['csvfile'].readline())
                    dialect = csv_ext.patchup(dialect)
                    request.FILES['csvfile'].seek(0)
                    for (lno, line) in enumerate(csv.reader(request.FILES['csvfile'], dialect=dialect)):
                        # basic input verification
                        if lno < 1:
                            continue
                        try:
                            (number, title, text, reason, first_name, last_name, is_group) = line[:7]
                            if is_group.strip().lower() in ['y', 'j', 't', 'yes', 'ja', 'true', '1', 1]:
                                is_group = True
                            else:
                                is_group = False
                        except ValueError:
                            messages.error(request, _('Ignoring malformed line %d in import file.') % (lno + 1))
                            continue
                        form = MotionForm({'title': title, 'text': text, 'reason': reason})
                        if not form.is_valid():
                            messages.error(request, _('Ignoring malformed line %d in import file.') % (lno + 1))
                            continue
                        if number:
                            try:
                                number = abs(long(number))
                                if number < 1:
                                    messages.error(request, _('Ignoring malformed line %d in import file.') % (lno + 1))
                                    continue
                            except ValueError:
                                messages.error(request, _('Ignoring malformed line %d in import file.') % (lno + 1))
                                continue

                        if is_group:
                            # fetch existing groups or issue an error message
                            try:
                                user = Group.objects.get(name=last_name)
                                if user.group_as_person == False:
                                    messages.error(request, _('Ignoring line %d because the assigned group may not act as a person.') % (lno + 1))
                                    continue
                                else:
                                    user = get_person(user.person_id)

                                groups_assigned += 1
                            except Group.DoesNotExist:
                                group = Group()
                                group.group_as_person = True
                                group.description = _('Created by motion import.')
                                group.name = last_name
                                group.save()
                                groups_generated += 1

                                user = get_person(group.person_id)
                        else:
                            # fetch existing users or create new users as needed
                            try:
                                user = User.objects.get(first_name=first_name, last_name=last_name)
                            except User.DoesNotExist:
                                user = None
                            if user is None:
                                if not first_name or not last_name:
                                    messages.error(request, _('Ignoring line %d because it contains an incomplete first / last name pair.') % (lno + 1))
                                    continue

                                user = User()
                                user.last_name = last_name
                                user.first_name = first_name
                                user.username = gen_username(first_name, last_name)
                                user.structure_level = ''
                                user.committee = ''
                                user.gender = ''
                                user.type = ''
                                user.default_password = gen_password()
                                user.save()
                                user.reset_password()
                                users_generated += 1
                        # create / modify the motion
                        motion = None
                        if number:
                            try:
                                motion = Motion.objects.get(number=number)
                                motions_modified += 1
                            except Motion.DoesNotExist:
                                motion = None
                        if motion is None:
                            motion = Motion(submitter=user)
                            if number:
                                motion.number = number
                            motions_generated += 1

                        motion.title = form.cleaned_data['title']
                        motion.text = form.cleaned_data['text']
                        motion.reason = form.cleaned_data['reason']
                        if import_permitted:
                            motion.status = 'per'

                        motion.save(user, trivial_change=True)

                if motions_generated:
                    messages.success(request, ungettext('%d motion was successfully imported.',
                                                '%d motions were successfully imported.', motions_generated) % motions_generated)
                if motions_modified:
                    messages.success(request, ungettext('%d motion was successfully modified.',
                                                '%d motions were successfully modified.', motions_modified) % motions_modified)
                if users_generated:
                    messages.success(request, ungettext('%d new user was added.', '%d new users were added.', users_generated) % users_generated)

                if groups_generated:
                    messages.success(request, ungettext('%d new group was added.', '%d new groups were added.', groups_generated) % groups_generated)

                if groups_assigned:
                    messages.success(request, ungettext('%d group assigned to motions.', '%d groups assigned to motions.', groups_assigned) % groups_assigned)
                return redirect(reverse('motion_overview'))

            except csv.Error:
                messages.error(request, _('Import aborted because of severe errors in the input file.'))
            except UnicodeDecodeError:
                messages.error(request, _('Import file has wrong character encoding, only UTF-8 is supported!'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        messages.warning(request, _("Attention: Existing motions will be modified if you import new motions with the same number."))
        messages.warning(request, _("Attention: Importing an motions without a number multiple times will create duplicates."))
        form = MotionImportForm()
    return {
        'form': form,
    }


class CreateAgendaItem(RedirectView):
    permission_required = 'agenda.can_manage_agenda'

    def pre_redirect(self, request, *args, **kwargs):
        self.motion = Motion.objects.get(pk=kwargs['motion_id'])
        self.item = Item(related_sid=self.motion.sid)
        self.item.save()

    def get_redirect_url(self, **kwargs):
        return reverse('item_overview')


class MotionPDF(PDFView):
    permission_required = 'motion.can_see_motion'
    top_space = 0

    def get_filename(self):
        motion_id = self.kwargs['motion_id']
        if motion_id is None:
            filename = _("Motions")
        else:
            motion = Motion.objects.get(id=motion_id)
            if motion.number:
                number = motion.number
            else:
                number = ""
            filename = u'%s%s' % (_("Motion"), str(number))
        return filename

    def append_to_pdf(self, story):
        motion_id = self.kwargs['motion_id']
        if motion_id is None:  #print all motions
            title = config["motion_pdf_title"]
            story.append(Paragraph(title, stylesheet['Heading1']))
            preamble = config["motion_pdf_preamble"]
            if preamble:
                story.append(Paragraph("%s" % preamble.replace('\r\n','<br/>'), stylesheet['Paragraph']))
            story.append(Spacer(0,0.75*cm))
            motions = Motion.objects.all()
            if not motions: # No motions existing
                story.append(Paragraph(_("No motions available."), stylesheet['Heading3']))
            else: # Print all Motions
                # List of motions
                for motion in motions:
                    if motion.number:
                        story.append(Paragraph(_("Motion No.")+" %s: %s" % (motion.number, motion.title), stylesheet['Heading3']))
                    else:
                        story.append(Paragraph(_("Motion No.")+"&nbsp;&nbsp;&nbsp;: %s" % (motion.title), stylesheet['Heading3']))
                # Motions details (each motion on single page)
                for motion in motions:
                    story.append(PageBreak())
                    story = self.get_motion(motion, story)
        else:  # print selected motion
            motion = Motion.objects.get(id=motion_id)
            story = self.get_motion(motion, story)

    def get_motion(self, motion, story):
        # Preparing Table
        data = []

        # motion number
        if motion.number:
            story.append(Paragraph(_("Motion No.")+" %s" % motion.number, stylesheet['Heading1']))
        else:
            story.append(Paragraph(_("Motion No."), stylesheet['Heading1']))

        # submitter
        cell1a = []
        cell1a.append(Spacer(0, 0.2 * cm))
        cell1a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Submitter"), stylesheet['Heading4']))
        cell1b = []
        cell1b.append(Spacer(0, 0.2 * cm))
        cell1b.append(Paragraph("%s" % motion.submitter, stylesheet['Normal']))
        data.append([cell1a, cell1b])

        if motion.status == "pub":
            # Cell for the signature
            cell2a = []
            cell2b = []
            cell2a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Signature"), stylesheet['Heading4']))
            cell2b.append(Paragraph("__________________________________________", stylesheet['Signaturefield']))
            cell2b.append(Spacer(0, 0.1 * cm))
            cell2b.append(Spacer(0,0.2*cm))
            data.append([cell2a, cell2b])

        # supporters
        if config['motion_min_supporters']:
            cell3a = []
            cell3b = []
            cell3a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font><seqreset id='counter'>" % _("Supporters"), stylesheet['Heading4']))
            for supporter in motion.supporters:
                cell3b.append(Paragraph("<seq id='counter'/>.&nbsp; %s" % supporter, stylesheet['Signaturefield']))
            if motion.status == "pub":
                for x in range(motion.missing_supporters):
                    cell3b.append(Paragraph("<seq id='counter'/>.&nbsp; __________________________________________",stylesheet['Signaturefield']))
            cell3b.append(Spacer(0, 0.2 * cm))
            data.append([cell3a, cell3b])

        # status
        cell4a = []
        cell4b = []
        note = " ".join(motion.notes)
        cell4a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Status"), stylesheet['Heading4']))
        if note != "":
            if motion.status == "pub":
                cell4b.append(Paragraph(note, stylesheet['Normal']))
            else:
                cell4b.append(Paragraph("%s | %s" % (motion.get_status_display(), note), stylesheet['Normal']))
        else:
            cell4b.append(Paragraph("%s" % motion.get_status_display(), stylesheet['Normal']))
        data.append([cell4a, cell4b])

        # Version number (aid)
        if motion.public_version.aid > 1:
            cell5a = []
            cell5b = []
            cell5a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Version"), stylesheet['Heading4']))
            cell5b.append(Paragraph("%s" % motion.public_version.aid, stylesheet['Normal']))
            data.append([cell5a, cell5b])

        # voting results
        poll_results = motion.get_poll_results()
        if poll_results:
            cell6a = []
            cell6a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Vote results"), stylesheet['Heading4']))
            cell6b = []
            ballotcounter = 0
            for result in poll_results:
                ballotcounter += 1
                if len(poll_results) > 1:
                    cell6b.append(Paragraph("%s. %s" % (ballotcounter, _("Vote")), stylesheet['Bold']))
                cell6b.append(Paragraph("%s: %s <br/> %s: %s <br/> %s: %s <br/> %s: %s <br/> %s: %s" % (_("Yes"), result[0], _("No"), result[1], _("Abstention"), result[2], _("Invalid"), result[3], _("Votes cast"), result[4]), stylesheet['Normal']))
                cell6b.append(Spacer(0, 0.2*cm))
            data.append([cell6a, cell6b])

        # Creating Table
        t = Table(data)
        t._argW[0] = 4.5 * cm
        t._argW[1] = 11 * cm
        t.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 1, colors.black),
                               ('VALIGN', (0,0), (-1,-1), 'TOP')]))
        story.append(t)
        story.append(Spacer(0, 1 * cm))

        # title
        story.append(Paragraph(motion.public_version.title, stylesheet['Heading3']))
        # text
        story.append(Paragraph("%s" % motion.public_version.text.replace('\r\n','<br/>'), stylesheet['Paragraph']))
        # reason
        if motion.public_version.reason:
            story.append(Paragraph(_("Reason")+":", stylesheet['Heading3']))
            story.append(Paragraph("%s" % motion.public_version.reason.replace('\r\n','<br/>'), stylesheet['Paragraph']))
        return story


class MotionPollPDF(PDFView):
    permission_required = 'motion.can_manage_motion'
    top_space = 0

    def get(self, request, *args, **kwargs):
        self.poll = MotionPoll.objects.get(id=self.kwargs['poll_id'])
        return super(MotionPollPDF, self).get(request, *args, **kwargs)

    def get_filename(self):
        filename = u'%s%s_%s' % (_("Motion"), str(self.poll.motion.number), _("Poll"))
        return filename

    def get_template(self, buffer):
        return SimpleDocTemplate(buffer, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0, showBoundary=False)

    def build_document(self, pdf_document, story):
        pdf_document.build(story)

    def append_to_pdf(self, story):
        imgpath = os.path.join(settings.SITE_ROOT, 'static/images/circle.png')
        circle = "<img src='%s' width='15' height='15'/>&nbsp;&nbsp;" % imgpath
        cell = []
        cell.append(Spacer(0,0.8*cm))
        cell.append(Paragraph(_("Motion No. %s") % self.poll.motion.number, stylesheet['Ballot_title']))
        cell.append(Paragraph(self.poll.motion.title, stylesheet['Ballot_subtitle']))
        cell.append(Paragraph(_("%d. Vote") % self.poll.get_ballot(), stylesheet['Ballot_description']))
        cell.append(Spacer(0,0.5*cm))
        cell.append(Paragraph(circle + unicode(_("Yes")), stylesheet['Ballot_option']))
        cell.append(Paragraph(circle + unicode(_("No")), stylesheet['Ballot_option']))
        cell.append(Paragraph(circle + unicode(_("Abstention")), stylesheet['Ballot_option']))
        data= []
        # get ballot papers config values
        ballot_papers_selection = config["motion_pdf_ballot_papers_selection"]
        ballot_papers_number = config["motion_pdf_ballot_papers_number"]

        # set number of ballot papers
        if ballot_papers_selection == "NUMBER_OF_DELEGATES":
            number = User.objects.filter(type__iexact="delegate").count()
        elif ballot_papers_selection == "NUMBER_OF_ALL_PARTICIPANTS":
            number = int(User.objects.count())
        else: # ballot_papers_selection == "CUSTOM_NUMBER"
            number = int(ballot_papers_number)
        number = max(1, number)

        # print ballot papers
        if number > 0:
            for user in xrange(number / 2):
                data.append([cell, cell])
            rest = number % 2
            if rest:
                data.append([cell, ''])
            t=Table(data, 10.5 * cm, 7.42 * cm)
            t.setStyle(TableStyle([('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(t)


class Config(FormView):
    permission_required = 'config.can_manage_config'
    form_class = ConfigForm
    template_name = 'motion/config.html'

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
    selected = True if request.path.startswith('/motion/') else False
    return Tab(
        title=_('Motions'),
        url=reverse('motion_overview'),
        permission=request.user.has_perm('motion.can_see_motion') or request.user.has_perm('motion.can_support_motion') or request.user.has_perm('motion.can_support_motion') or request.user.has_perm('motion.can_manage_motion'),
        selected=selected,
    )


def get_widgets(request):
    return [
        Widget(
            name='motions',
            display_name=_('Motions'),
            template='motion/widget.html',
            context={'motions': Motion.objects.all()},
            permission_required='projector.can_manage_projector')]
