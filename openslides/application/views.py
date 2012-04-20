#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.application.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the application app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""
from __future__ import with_statement

import csv
import utils.csv_ext
import os

from urllib import urlencode
try:
    from urlparse import parse_qs
except ImportError: # python <= 2.5
    from cgi import parse_qs

from django.shortcuts import redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User, Group
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.utils.translation import ungettext
from django.db import transaction

from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import PageBreak, Paragraph, Spacer, Table, TableStyle

from config.models import config
from settings import SITE_ROOT
from utils.pdf import stylesheet
from utils.views import PDFView, RedirectView

from agenda.models import Item

from application.models import Application, AVersion, ApplicationPoll
from application.forms import (
    ApplicationForm,
    ApplicationManagerForm,
    ApplicationImportForm,
    ConfigForm,
)

from participant.models import Profile

from poll.views import PollFormView

from utils.utils import template, permission_required, \
                                   render_to_forbitten, del_confirm_form, gen_confirm_form
from utils.views import FormView
from utils.template import Tab

from participant.api import gen_username, gen_password


@permission_required('application.can_see_application')
@template('application/overview.html')
def overview(request):
    """
    View all applications
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

    query = Application.objects.all()
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

    if 'reverse' in sortfilter:
        query = query.reverse()

    # todo: rewrite this with a .filter()
    if 'needsup' in sortfilter:
        applications = []
        for application in query.all():
            if not application.enough_supporters:
                applications.append(application)
    else:
        applications = query

    return {
        'applications': applications,
        'min_supporters': int(config['application_min_supporters']),
    }


@permission_required('application.can_see_application')
@template('application/view.html')
def view(request, application_id, newest=False):
    """
    View one application.
    """
    application = Application.objects.get(pk=application_id)
    if newest:
        version = application.last_version
    else:
        version = application.public_version
    revisions = application.versions
    actions = application.get_allowed_actions(user=request.user)

    return {
        'application': application,
        'revisions': revisions,
        'actions': actions,
        'min_supporters': int(config['application_min_supporters']),
        'version': version,
        #'results': application.results
    }


@login_required
@template('application/edit.html')
def edit(request, application_id=None):
    """
    View a form to edit or create a application.
    """
    if request.user.has_perm('application.can_manage_application'):
        is_manager = True
    else:
        is_manager = False

    if not is_manager \
    and not request.user.has_perm('application.can_create_application'):
        messages.error(request, _("You have not the necessary rights to create or edit applications."))
        return redirect(reverse('application_overview'))
    if application_id is not None:
        application = Application.objects.get(id=application_id)
        if not request.user == application.submitter and not is_manager:
            messages.error(request, _("You can not edit this application. You are not the submitter."))
            return redirect(reverse('application_view', args=[application.id]))
    else:
        application = None

    if request.method == 'POST':
        dataform = ApplicationForm(request.POST, prefix="data")
        valid = dataform.is_valid()

        if is_manager:
            managerform = ApplicationManagerForm(request.POST, \
                            instance=application, \
                            prefix="manager")
            valid = valid and managerform.is_valid()
        else:
            managerform = None

        if valid:
            del_supporters = True
            original_supporters = []
            if is_manager:
                if application:
                    for s in application.supporter.all():
                        original_supporters.append(s)
                application = managerform.save()
            elif application_id is None:
                application = Application(submitter=request.user)
            application.title = dataform.cleaned_data['title']
            application.text = dataform.cleaned_data['text']
            application.reason = dataform.cleaned_data['reason']
            application.save(request.user, trivial_change=dataform.cleaned_data['trivial_change'])
            if is_manager:
                # log added supporters
                supporters_added = []
                for s in application.supporter.all():
                    if s not in original_supporters:
                        try:
                            supporters_added.append(unicode(s.profile))
                        except Profile.DoesNotExist:
                            pass
                if len(supporters_added) > 0:
                    log_added = ", ".join(supporters_added)
                    application.writelog(_("Supporter: +%s") % log_added, request.user)
                # log removed supporters
                supporters_removed = []
                for s in original_supporters:
                    if s not in application.supporter.all():
                        try:
                            supporters_removed.append(unicode(s.profile))
                        except Profile.DoesNotExist:
                            pass
                if len(supporters_removed) > 0:
                    log_removed = ", ".join(supporters_removed)
                    application.writelog(_("Supporter: -%s") % log_removed, request.user)
            if application_id is None:
                messages.success(request, _('New application was successfully created.'))
            else:
                messages.success(request, _('Application was successfully modified.'))

            if not 'apply' in request.POST:
                return redirect(reverse('application_view', args=[application.id]))
            if application_id is None:
                return redirect(reverse('application_edit', args=[application.id]))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        if application_id is None:
            initial = {'text': config['application_preamble']}
        else:
            if application.status == "pub" and application.supporter.count() > 0:
                if request.user.has_perm('application.can_manage_application'):
                    messages.warning(request, _("Attention: Do you really want to edit this application? The supporters will <b>not</b> be removed automatically because you can manage applications. Please check if the supports are valid after your changing!"))
                else:
                    messages.warning(request, _("Attention: Do you really want to edit this application? All <b>%s</b> supporters will be removed! Try to convince the supporters again.") % application.supporter.count() )
            initial = {'title': application.title,
                       'text': application.text,
                       'reason': application.reason}

        dataform = ApplicationForm(initial=initial, prefix="data")
        if is_manager:
            if application_id is None:
                initial = {'submitter': str(request.user.id)}
            else:
                initial = {}
            managerform = ApplicationManagerForm(initial=initial, \
                                                 instance=application, \
                                                 prefix="manager")
        else:
            managerform = None
    return {
        'form': dataform,
        'managerform': managerform,
        'application': application,
    }

@login_required
@template('application/view.html')
def delete(request, application_id):
    """
    delete a application.
    """
    application = Application.objects.get(id=application_id)
    if not 'delete' in application.get_allowed_actions(user=request.user):
        messages.error(request, _("You can not delete application <b>%s</b>.") % application)
    else:
        if request.method == 'POST':
            try:
                title = str(application)
                application.delete()
                messages.success(request, _("Application <b>%s</b> was successfully deleted.") % title)
            except NameError, name:
                messages.error(request, name)
        else:
            del_confirm_form(request, application)
    return redirect(reverse('application_overview'))


@permission_required('application.can_manage_application')
@template('application/view.html')
def set_number(request, application_id):
    """
    set a number for an application.
    """
    try:
        Application.objects.get(pk=application_id).set_number(user=request.user)
        messages.success(request, _("Application number was successfully set."))
    except Application.DoesNotExist:
        pass
    except NameError:
        pass
    return redirect(reverse('application_view', args=[application_id]))


@permission_required('application.can_manage_application')
@template('application/view.html')
def permit(request, application_id):
    """
    permit an application.
    """
    try:
        Application.objects.get(pk=application_id).permit(user=request.user)
        messages.success(request, _("Application was successfully permitted."))
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))

@permission_required('application.can_manage_application')
@template('application/view.html')
def notpermit(request, application_id):
    """
    reject (not permit) an application.
    """
    try:
        Application.objects.get(pk=application_id).notpermit(user=request.user)
        messages.success(request, _("Application was successfully rejected."))
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))

@template('application/view.html')
def set_status(request, application_id=None, status=None):
    """
    set a status of an application.
    """
    try:
        if status is not None:
            application = Application.objects.get(pk=application_id)
            application.set_status(user=request.user, status=status)
            messages.success(request, _("Application status was set to: <b>%s</b>.") % application.get_status_display())
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))


@permission_required('application.can_manage_application')
@template('application/view.html')
def reset(request, application_id):
    """
    reset an application.
    """
    try:
        Application.objects.get(pk=application_id).reset(user=request.user)
        messages.success(request, _("Application status was reset.") )
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))


@permission_required('application.can_support_application')
@template('application/view.html')
def support(request, application_id):
    """
    support an application.
    """
    try:
        Application.objects.get(pk=application_id).support(user=request.user)
        messages.success(request, _("You have support the application successfully.") )
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))


@permission_required('application.can_support_application')
@template('application/view.html')
def unsupport(request, application_id):
    """
    unsupport an application.
    """
    try:
        Application.objects.get(pk=application_id).unsupport(user=request.user)
        messages.success(request, _("You have unsupport the application successfully.") )
    except Application.DoesNotExist:
        pass
    return redirect(reverse('application_view', args=[application_id]))


@permission_required('application.can_manage_application')
@template('application/view.html')
def gen_poll(request, application_id):
    """
    gen a poll for this application.
    """
    try:
        poll = Application.objects.get(pk=application_id).gen_poll(user=request.user)
        messages.success(request, _("New vote was successfully created.") )
    except Application.DoesNotExist:
        pass # TODO: do not call poll after this excaption
    return redirect(reverse('application_poll_view', args=[poll.id]))


@permission_required('application.can_manage_application')
def delete_poll(request, poll_id):
    """
    delete a poll from this application
    """
    poll = ApplicationPoll.objects.get(pk=poll_id)
    application = poll.application
    count = application.polls.filter(id__lte=poll_id).count()
    if request.method == 'POST':
        poll.delete()
        messages.success(request, _('Poll was successfully deleted.'))
    else:
        del_confirm_form(request, poll, name=_("the %s. poll") % count, delete_link=reverse('application_poll_delete', args=[poll_id]))
    return redirect(reverse('application_view', args=[application.id]))


class ViewPoll(PollFormView):
    permission_required = 'application.can_manage_application'
    poll_class = ApplicationPoll
    template_name = 'application/poll_view.html'

    def get_context_data(self, **kwargs):
        context = super(ViewPoll, self).get_context_data(**kwargs)
        self.application = self.poll.get_application()
        context['application'] = self.application
        context['ballot'] = self.poll.get_ballot()
        return context

    def get_success_url(self):
        if not 'apply' in self.request.POST:
            return reverse('application_view', args=[self.poll.application.id])
        return ''


@permission_required('application.can_manage_application')
def permit_version(request, aversion_id):
    aversion = AVersion.objects.get(pk=aversion_id)
    application = aversion.application
    if request.method == 'POST':
        application.accept_version(aversion)
        messages.success(request, _("Version <b>%s</b> accepted.") % (aversion.aid))
    else:
        gen_confirm_form(request, _('Do you really want to permit version <b>%s</b>?') % aversion.aid, reverse('application_version_permit', args=[aversion.id]))
    return redirect(reverse('application_view', args=[application.id]))


@permission_required('application.can_manage_application')
def reject_version(request, aversion_id):
    aversion = AVersion.objects.get(pk=aversion_id)
    application = aversion.application
    if request.method == 'POST':
        if application.reject_version(aversion):
            messages.success(request, _("Version <b>%s</b> rejected.") % (aversion.aid))
        else:
            messages.error(request, _("ERROR by rejecting the version.") )
    else:
        gen_confirm_form(request, _('Do you really want to reject version <b>%s</b>?') % aversion.aid, reverse('application_version_reject', args=[aversion.id]))
    return redirect(reverse('application_view', args=[application.id]))


@permission_required('application.can_manage_application')
@template('application/import.html')
def application_import(request):
    try:
        request.user.profile
        messages.error(request, _('The import function is available for the superuser (without user profile) only.'))
        return redirect(reverse('application_overview'))
    except Profile.DoesNotExist:
        pass
    except AttributeError:
        # AnonymousUser
        pass

    if request.method == 'POST':
        form = ApplicationImportForm(request.POST, request.FILES)
        if form.is_valid():
            import_permitted = form.cleaned_data['import_permitted']
            try:
                # check for valid encoding (will raise UnicodeDecodeError if not)
                request.FILES['csvfile'].read().decode('utf-8')
                request.FILES['csvfile'].seek(0)

                users_generated = 0
                applications_generated = 0
                applications_modified = 0
                with transaction.commit_on_success():
                    dialect = csv.Sniffer().sniff(request.FILES['csvfile'].readline())
                    dialect = utils.csv_ext.patchup(dialect)
                    request.FILES['csvfile'].seek(0)
                    for (lno, line) in enumerate(csv.reader(request.FILES['csvfile'], dialect=dialect)):
                        # basic input verification
                        if lno < 1:
                            continue
                        try:
                            (number, title, text, reason, first_name, last_name) = line[:6]
                        except ValueError:
                            messages.error(request, _('Ignoring malformed line %d in import file.') % (lno + 1))
                            continue
                        form = ApplicationForm({'title': title, 'text': text, 'reason': reason})
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
                        # fetch existing users or create new users as needed
                        try:
                            user = User.objects.get(first_name=first_name, last_name=last_name)
                        except User.DoesNotExist:
                            user = None
                        if user is None:
                            user = User()
                            user.last_name = last_name
                            user.first_name = first_name
                            user.username = gen_username(first_name, last_name)
                            user.save()
                            profile = Profile()
                            profile.user = user
                            profile.group = ''
                            profile.committee = ''
                            profile.gender = 'none'
                            profile.type = 'guest'
                            profile.firstpassword = gen_password()
                            profile.user.set_password(profile.firstpassword)
                            profile.save()
                            users_generated += 1
                        # create / modify the application
                        application = None
                        if number:
                            try:
                                application = Application.objects.get(number=number)
                                applications_modified += 1
                            except Application.DoesNotExist:
                                application = None
                        if application is None:
                            application = Application(submitter=user)
                            if number:
                                application.number = number
                            applications_generated += 1

                        application.title = form.cleaned_data['title']
                        application.text = form.cleaned_data['text']
                        application.reason = form.cleaned_data['reason']
                        if import_permitted:
                            application.status = 'per'

                        application.save(user, trivial_change=True)

                if applications_generated:
                    messages.success(request, ungettext('%d application was successfully imported.',
                                                '%d applications were successfully imported.', applications_generated) % applications_generated)
                if applications_modified:
                    messages.success(request, ungettext('%d application was successfully modified.',
                                                '%d applications were successfully modified.', applications_modified) % applications_modified)
                if users_generated:
                    messages.success(request, ungettext('%d new user was added.', '%d new users were added.', users_generated) % users_generated)
                return redirect(reverse('application_overview'))

            except csv.Error:
                message.error(request, _('Import aborted because of severe errors in the input file.'))
            except UnicodeDecodeError:
                messages.error(request, _('Import file has wrong character encoding, only UTF-8 is supported!'))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        messages.warning(request, _("Attention: Existing applications will be modified if you import new applications with the same number."))
        messages.warning(request, _("Attention: Importing an application without a number multiple times will create duplicates."))
        form = ApplicationImportForm()
    return {
        'form': form,
    }


class CreateAgendaItem(RedirectView):
    permission_required = 'agenda.can_manage_agenda'

    def pre_redirect(self, request, *args, **kwargs):
        self.application = Application.objects.get(pk=kwargs['application_id'])
        self.item = Item(releated_sid=self.application.sid)
        self.item.save()

    def get_redirect_url(self, **kwargs):
        return reverse('item_view', args=[self.item.id])


class ApplicationPDF(PDFView):
    permission_required = 'application.can_manage_application'
    top_space = 0

    def get_filename(self):
        application_id = self.kwargs['application_id']
        if application_id is None:
            filename = _("Applications")
        else:
            application = Application.objects.get(id=application_id)
            if application.number:
                number = application.number
            else:
                number = ""
            filename = u'%s%s' % (_("Application"), str(number))
        return filename

    def append_to_pdf(self, story):
        application_id = self.kwargs['application_id']
        if application_id is None:  #print all applications
            title = config["application_pdf_title"]
            story.append(Paragraph(title, stylesheet['Heading1']))
            preamble = config["application_pdf_preamble"]
            if preamble:
                story.append(Paragraph("%s" % preamble.replace('\r\n','<br/>'), stylesheet['Paragraph']))
            story.append(Spacer(0,0.75*cm))
            # List of applications
            for application in Application.objects.order_by('number'):
                if application.number:
                    story.append(Paragraph(_("Application No.")+" %s: %s" % (application.number, application.title), stylesheet['Heading3']))
                else:
                    story.append(Paragraph(_("Application No.")+"&nbsp;&nbsp;&nbsp;: %s" % (application.title), stylesheet['Heading3']))
            # Applications details (each application on single page)
            for application in Application.objects.order_by('number'):
                story.append(PageBreak())
                story = self.get_application(application, story)
        else:  # print selected application
            application = Application.objects.get(id=application_id)
            story = self.get_application(application, story)

    def get_application(self, application, story):
        # application number
        if application.number:
            story.append(Paragraph(_("Application No.")+" %s" % application.number, stylesheet['Heading1']))
        else:
            story.append(Paragraph(_("Application No."), stylesheet['Heading1']))

        # submitter
        cell1a = []
        cell1a.append(Spacer(0,0.2*cm))
        cell1a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Submitter"), stylesheet['Heading4']))
        cell1b = []
        cell1b.append(Spacer(0,0.2*cm))
        if application.status == "pub":
            cell1b.append(Paragraph("__________________________________________",stylesheet['Signaturefield']))
            cell1b.append(Spacer(0,0.1*cm))
            cell1b.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+unicode(application.submitter.profile), stylesheet['Small']))
            cell1b.append(Spacer(0,0.2*cm))
        else:
            cell1b.append(Paragraph(unicode(application.submitter.profile), stylesheet['Normal']))

        # supporters
        cell2a = []
        cell2a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font><seqreset id='counter'>" % _("Supporters"), stylesheet['Heading4']))
        cell2b = []
        for s in application.supporter.all():
            cell2b.append(Paragraph("<seq id='counter'/>.&nbsp; %s" % unicode(s.profile), stylesheet['Signaturefield']))
        if application.status == "pub":
            for x in range(0,application.missing_supporters):
                cell2b.append(Paragraph("<seq id='counter'/>.&nbsp; __________________________________________",stylesheet['Signaturefield']))
        cell2b.append(Spacer(0,0.2*cm))

        # status
        note = ""
        for n in application.notes:
            note += "%s " % unicode(n)
        cell3a = []
        cell3a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Status"), stylesheet['Heading4']))
        cell3b = []
        if note != "":
            if application.status == "pub":
                cell3b.append(Paragraph(note, stylesheet['Normal']))
            else:
                cell3b.append(Paragraph("%s | %s" % (application.get_status_display(), note), stylesheet['Normal']))
        else:
            cell3b.append(Paragraph("%s" % application.get_status_display(), stylesheet['Normal']))

        # table
        data = []
        data.append([cell1a,cell1b])
        data.append([cell2a,cell2b])
        data.append([cell3a,cell3b])

        poll_results = application.get_poll_results()
        # voting results
        if poll_results:
            cell4a = []
            cell4a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Vote results"), stylesheet['Heading4']))
            cell4b = []
            ballotcounter = 0
            for result in poll_results:
                ballotcounter += 1
                if len(poll_results) > 1:
                    cell4b.append(Paragraph("%s. %s" % (ballotcounter, _("Vote")), stylesheet['Bold']))
                cell4b.append(Paragraph("%s: %s <br/> %s: %s <br/> %s: %s <br/> %s: %s <br/> %s: %s" % (_("Yes"), result[0], _("No"), result[1], _("Abstention"), result[2], _("Invalid"), result[3], _("Votes cast"), result[4]), stylesheet['Normal']))
                cell4b.append(Spacer(0,0.2*cm))
            data.append([cell4a,cell4b])

        t=Table(data)
        t._argW[0]=4.5*cm
        t._argW[1]=11*cm
        t.setStyle(TableStyle([ ('BOX', (0,0), (-1,-1), 1, colors.black),
                                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                              ]))
        story.append(t)
        story.append(Spacer(0,1*cm))

        # title
        story.append(Paragraph(application.title, stylesheet['Heading3']))
        # text
        story.append(Paragraph("%s" % application.text.replace('\r\n','<br/>'), stylesheet['Paragraph']))
        # reason
        story.append(Paragraph(_("Reason")+":", stylesheet['Heading3']))
        story.append(Paragraph("%s" % application.reason.replace('\r\n','<br/>'), stylesheet['Paragraph']))
        return story


class ApplicationPollPDF(PDFView):
    permission_required = 'application.can_manage_application'
    top_space = 0

    def get(self, request, *args, **kwargs):
        self.poll = ApplicationPoll.objects.get(id=self.kwargs['poll_id'])
        return super(ApplicationPollPDF, self).get(request, *args, **kwargs)

    def get_filename(self):
        filename = u'%s%s_%s' % (_("Application"), str(self.poll.application.number), _("Poll"))
        return filename

    def append_to_pdf(self, story):
        imgpath = os.path.join(SITE_ROOT, 'static/images/circle.png')
        circle = "<img src='%s' width='15' height='15'/>&nbsp;&nbsp;" % imgpath
        cell = []
        cell.append(Spacer(0,0.8*cm))
        cell.append(Paragraph(_("Application No.")+" "+str(self.poll.application.number), stylesheet['Ballot_title']))
        cell.append(Paragraph(self.poll.application.title, stylesheet['Ballot_subtitle']))
        cell.append(Paragraph(str(self.poll.get_ballot())+". "+_("Vote"), stylesheet['Ballot_description']))
        cell.append(Spacer(0,0.5*cm))
        cell.append(Paragraph(circle+_("Yes"), stylesheet['Ballot_option']))
        cell.append(Paragraph(circle+_("No"), stylesheet['Ballot_option']))
        cell.append(Paragraph(circle+_("Abstention"), stylesheet['Ballot_option']))
        data= []
        # get ballot papers config values
        ballot_papers_selection = config["application_pdf_ballot_papers_selection"]
        ballot_papers_number = config["application_pdf_ballot_papers_number"]
        # set number of ballot papers
        if ballot_papers_selection == "1":
            number = User.objects.filter(profile__type__iexact="delegate").count()
        if ballot_papers_selection == "2":
            number = int(User.objects.count() - 1)
        if ballot_papers_selection == "0":
            number = int(ballot_papers_number)
        # print ballot papers
        if number > 0:
            for user in xrange(number/2):
                data.append([cell,cell])
            rest = number % 2
            if rest:
                data.append([cell,''])
            t=Table(data, 10.5*cm, 7.42*cm)
            t.setStyle(TableStyle([ ('GRID', (0,0), (-1,-1), 0.25, colors.grey),
                                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                              ]))
            story.append(t)


class Config(FormView):
    permission_required = 'config.can_manage_config'
    form_class = ConfigForm
    template_name = 'application/config.html'

    def get_initial(self):
        return {
            'application_min_supporters': config['application_min_supporters'],
            'application_preamble': config['application_preamble'],
            'application_pdf_ballot_papers_selection': config['application_pdf_ballot_papers_selection'],
            'application_pdf_ballot_papers_number': config['application_pdf_ballot_papers_number'],
            'application_pdf_title': config['application_pdf_title'],
            'application_pdf_preamble': config['application_pdf_preamble'],
        }

    def form_valid(self, form):
        config['application_min_supporters'] = form.cleaned_data['application_min_supporters']
        config['application_preamble'] = form.cleaned_data['application_preamble']
        config['application_pdf_ballot_papers_selection'] = form.cleaned_data['application_pdf_ballot_papers_selection']
        config['application_pdf_ballot_papers_number'] = form.cleaned_data['application_pdf_ballot_papers_number']
        config['application_pdf_title'] = form.cleaned_data['application_pdf_title']
        config['application_pdf_preamble'] = form.cleaned_data['application_pdf_preamble']
        messages.success(self.request, _('Application settings successfully saved.'))
        return super(Config, self).form_valid(form)


def register_tab(request):
    selected = True if request.path.startswith('/application/') else False
    return Tab(
        title=_('Applications'),
        url=reverse('application_overview'),
        permission=request.user.has_perm('application.can_see_application') or request.user.has_perm('application.can_support_application') or request.user.has_perm('application.can_support_application') or request.user.has_perm('application.can_manage_application'),
        selected=selected,
    )
