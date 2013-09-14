#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignment.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the assignment app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import os

from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, PageBreak, Paragraph, Spacer, Table, TableStyle)
from reportlab.lib.units import cm

from django.conf import settings
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.utils.translation import ungettext, ugettext as _

from django.views.generic.detail import SingleObjectMixin

from openslides.utils.pdf import stylesheet
from openslides.utils.template import Tab
from openslides.utils.utils import (template, permission_required,
    gen_confirm_form, ajax_request)

from openslides.utils.views import (CreateView, DeleteView, UpdateView,
    ListView, PDFView, DetailView, View, PermissionMixin)
from openslides.utils.person import get_person
from openslides.config.api import config
from openslides.participant.models import User, Group
from openslides.projector.projector import Widget
from openslides.poll.views import PollFormView
from openslides.agenda.views import CreateRelatedAgendaItemView as _CreateRelatedAgendaItemView
from openslides.assignment.models import Assignment, AssignmentPoll
from openslides.assignment.forms import AssignmentForm, AssignmentRunForm


class AssignmentListView(ListView):
    """ListView for all Assignments"""
    permission_required = 'assignment.can_see_assignment'
    model = Assignment

    def get_queryset(self):
        query = self.model.objects
        if 'status' in self.request.GET and '---' not in self.request.GET['status']:
            query = query.filter(status__iexact=self.request.GET['status'])
        try:
            sort = self.request.GET['sort']
            if sort in ['name', 'status']:
                query = query.order_by(sort)
        except KeyError:
            pass
        if 'reverse' in self.request.GET:
            query = query.reverse()
        return query.all()


class AssignmentDetail(DetailView):
    permission_required = 'assignment.can_see_assignment'
    model = Assignment
    form_class = AssignmentRunForm

    def get_context_data(self, *args, **kwargs):
        context = super(AssignmentDetail, self).get_context_data(*args, **kwargs)
        if self.request.META.get('REQUEST_METHOD') == 'POST':
            context['form'] = self.form_class(self.request.POST)
        else:
            context['form'] = self.form_class()
        polls = self.object.poll_set.all()
        if not self.request.user.has_perm('assignment.can_manage_assignment'):
            polls = self.object.poll_set.filter(published=True)
            vote_results = self.object.vote_results(only_published=True)
        else:
            polls = self.object.poll_set.all()
            vote_results = self.object.vote_results(only_published=False)

        blocked_candidates = [
            candidate.person for candidate in
            self.object.assignment_candidates.filter(blocked=True)]
        context['polls'] = polls
        context['vote_results'] = vote_results
        context['blocked_candidates'] = blocked_candidates
        return context

    def post(self, *args, **kwargs):
        self.object = self.get_object()
        if self.request.user.has_perm('assignment.can_nominate_other'):
            form = AssignmentRunForm(self.request.POST)
            if form.is_valid():
                user = form.cleaned_data['candidate']
                try:
                    self.object.run(user, self.request.user)
                except NameError, e:
                    messages.error(self.request, e)
                else:
                    messages.success(self.request, _(
                        "Candidate <b>%s</b> was nominated successfully.")
                        % user)
        return super(AssignmentDetail, self).get(*args, **kwargs) 


class AssignmentCreateView(CreateView):
    model = Assignment
    form_class = AssignmentForm
    permission_required = 'assignment.can_manage_assignment'

    def get_success_message(self):
        return _('New election was successfully created.')

    def get_success_url(self):
        return reverse("assignment_list")



class AssignmentUpdateView(UpdateView):
    model = Assignment
    form_class = AssignmentForm
    permission_required = 'assignment.can_manage_assignment'

    def get_success_message(self):
        return _('Election was successfully modified.')

    def get_success_url(self, *args, **kwargs):
        success_url = reverse('assignment_update', args=[self.object.pk])
        if not 'apply' in self.request.POST:
            success_url = reverse("assignment_list")
        return success_url


class AssignmentDeleteView(DeleteView):
    permission_required = 'assignment.can_manage_assignment'
    model = Assignment
    success_url_name = 'assignment_list'

    def get_success_message(self):
        return _('Election <b>%s</b> was successfully deleted.') % self.object


class AssignmentSetStatusView(SingleObjectMixin, PermissionMixin, View):
    model = Assignment
    permission_required = 'assignment.can_manage_assignment'

    def get(self, *args, **kwargs):
        status = kwargs.get('status')
        try:
            if status is not None:
                assignment = self.get_object()
                assignment.set_status(status)
                messages.success(self.request,
                    _('Election status was set to: <b>%s</b>.') % 
                    assignment.get_status_display())
        except self.model.DoesNotExist:
            pass
        except NameError, e:
            messages.error(self.request, e)
        return redirect(reverse('assignment_view', args=[kwargs['pk']]))


class AssignmentRunView(SingleObjectMixin, PermissionMixin, View):
    model = Assignment
    permission_required = 'assignment.can_nominate_self'

    def get(self, *args, **kwargs):
        assignment = self.get_object()
        try:
            assignment.run(self.request.user, self.request.user)
            messages.success(self.request,
                _('You have set your candidature successfully.'))
        except NameError, e:
            messages.error(self.request, e)
        return redirect(reverse('assignment_view', args=[assignment.pk]))


class AssignmentRunDeleteView(SingleObjectMixin, View):
    model = Assignment

    def get(self, *args, **kwargs):
        assignment = self.get_object()
        if assignment.status == 'sea' or self.request.user.has_perm(
                "assignment.can_manage_assignment"):
            try:
                assignment.delrun(self.request.user, blocked=True)
            except Exception, e:
                messages.error(self.request, e)
            else:
                messages.success(self.request,
                    _("You have withdrawn your candidature successfully. "
                      "You can not be nominated by other participants anymore.")
                )
        else:
            messages.error(self.request, _('The candidate list is already closed.'))
        return redirect(reverse('assignment_view', args=[kwargs.get('pk')]))


class AssignmentRunOtherDeleteView(SingleObjectMixin, PermissionMixin, View):
    model = Assignment
    permission_required = 'assignment.can_manage_assignment'

    def post(self, *args, **kwargs):
        assignment = self.get_object()
        person = get_person(kwargs.get('user_id'))
        is_blocked = assignment.is_blocked(person)
        if 'submit' in self.request.POST:
            try:
                assignment.delrun(person, blocked=False)
            except Exception, e:
                messages.error(self.request, e)
            else:
                if not is_blocked:
                    message = _("Candidate <b>%s</b> was withdrawn successfully.") % person
                else:
                    message = _("<b>%s</b> was unblocked successfully.") % person
                messages.success(self.request, message)
        return redirect(reverse('assignment_view', args=[kwargs.get('pk')]))

    def get(self, *args, **kwargs):
        user_id = kwargs.get('user_id')
        assignment = self.get_object()
        person = get_person(user_id)
        is_blocked = assignment.is_blocked(person)        
        if not is_blocked:
            message = _("Do you really want to withdraw <b>%s</b> from the election?") % person
        else:
            message = _("Do you really want to unblock <b>%s</b> for the election?") % person
        gen_confirm_form(self.request, message,
            reverse('assignment_delother', args=[assignment.pk, user_id]))
        return redirect(reverse('assignment_view', args=[assignment.pk]))

class GeneratePollView(SingleObjectMixin, PermissionMixin, View):
    model = Assignment
    permission_required = 'assignment.can_manage_assignment'

    def get(self, *args, **kwargs):
        poll = self.get_object().gen_poll()
        messages.success(self.request, _("New ballot was successfully created."))
        return redirect(reverse('assignment_poll_view', args=[poll.id]))

class ViewPoll(PollFormView):
    poll_class = AssignmentPoll
    template_name = 'assignment/poll_view.html'

    def get_context_data(self, **kwargs):
        context = super(ViewPoll, self).get_context_data(**kwargs)
        self.assignment = self.poll.get_assignment()
        context['assignment'] = self.assignment
        context['poll'] = self.poll
        context['polls'] = self.assignment.poll_set.filter(assignment=self.assignment)
        context['ballotnumber'] = self.poll.get_ballot()
        return context

    def get_success_url(self):
        return_url = ''
        if not 'apply' in self.request.POST:
            return_url = reverse('assignment_view', args=[self.poll.assignment.id])
        return return_url


class SetPublishStatusView(SingleObjectMixin, PermissionMixin, View):
    model = AssignmentPoll
    permission_required = 'assignment.can_manage_assignment'

    def get(self, *args, **kwargs):
        poll = self.get_object()
        return_url = redirect(reverse('assignment_view', 
            args=[poll.assignment.id]))
        try:
            if poll.published:
                poll.set_published(False)
            else:
                poll.set_published(True)

            if self.request.is_ajax():
                return_url = ajax_request({'published': poll.published})

            if poll.published:
                messages.success(self.request, _("Ballot successfully published."))
            else:
                messages.success(self.request, _("Ballot successfully unpublished."))
        except self.model.DoesNotExist:
            messages.error(self.request, _('Ballot ID %d does not exist.') %
                int(kwargs['poll_id']))
            return_url = redirect(reverse('assignment_list'))
        return return_url


class SetElectedView(SingleObjectMixin, PermissionMixin, View):
    model = Assignment
    permission_required = 'assignment.can_manage_assignment'

    def get(self, *args, **kwargs):
        assignment = self.get_object()
        person = get_person(kwargs['user_id'])
        elected = kwargs['elected']
        assignment.set_elected(person, elected)
    
        if self.request.is_ajax():
            if elected:
                link = reverse('assignment_user_not_elected', args=[assignment.id, person.person_id])
                text = _('not elected')
            else:
                link = reverse('assignment_user_elected', args=[assignment.id, person.person_id])
                text = _('elected')
            return ajax_request({'elected': elected, 'link': link, 'text': text})
    
        return redirect(reverse('assignment_view', args=[assignment.pk]))


class AssignmentPollDelete(DeleteView):
    """
    Delete an assignment poll object.
    """
    permission_required = 'assignment.can_manage_assignment'
    model = AssignmentPoll

    def pre_redirect(self, request, *args, **kwargs):
        self.set_assignment()
        super(AssignmentPollDelete, self).pre_redirect(request, *args, **kwargs)

    def pre_post_redirect(self, request, *args, **kwargs):
        self.set_assignment()
        super(AssignmentPollDelete, self).pre_post_redirect(request, *args, **kwargs)

    def set_assignment(self):
        self.assignment = self.object.assignment

    def get_redirect_url(self, **kwargs):
        return reverse('assignment_view', args=[self.assignment.id])

    def get_success_message(self):
        return _('Ballot was successfully deleted.')


class AssignmentPDF(PDFView):
    permission_required = 'assignment.can_see_assignment'
    top_space = 0

    def get_filename(self):
        try:
            assignment_id = self.kwargs['pk']
            assignment = Assignment.objects.get(id=assignment_id)
            filename = u'%s-%s' % (
                _("Assignment"),
                assignment.name.replace(' ', '_'))
        except:
            filename = _("Elections")
        return filename

    def append_to_pdf(self, story):
        try:
            assignment_id = self.kwargs['pk']
        except KeyError:
            assignment_id = None
        if assignment_id is None:  # print all assignments
            title = config["assignment_pdf_title"]
            story.append(Paragraph(title, stylesheet['Heading1']))
            preamble = config["assignment_pdf_preamble"]
            if preamble:
                story.append(Paragraph(
                    "%s" % preamble.replace('\r\n', '<br/>'),
                    stylesheet['Paragraph']))
            story.append(Spacer(0, 0.75 * cm))
            assignments = Assignment.objects.all()
            if not assignments:  # No assignments existing
                story.append(Paragraph(
                    _("No assignments available."), stylesheet['Heading3']))
            else:  # Print all assignments
                # List of assignments
                for assignment in assignments:
                    story.append(Paragraph(
                        assignment.name, stylesheet['Heading3']))
                # Assignment details (each assignment on single page)
                for assignment in assignments:
                    story.append(PageBreak())
                    # append the assignment to the story-object
                    self.get_assignment(assignment, story)
        else:  # print selected assignment
            assignment = Assignment.objects.get(id=assignment_id)
            # append the assignment to the story-object
            self.get_assignment(assignment, story)

    def get_assignment(self, assignment, story):
        # title
        story.append(Paragraph(
            _("Election: %s") % assignment.name, stylesheet['Heading1']))
        story.append(Spacer(0, 0.5 * cm))
        # posts
        cell1a = []
        cell1a.append(Paragraph(
            "<font name='Ubuntu-Bold'>%s:</font>" %
            _("Number of available posts"), stylesheet['Bold']))
        cell1b = []
        cell1b.append(Paragraph(str(assignment.posts), stylesheet['Paragraph']))
        # candidates
        cell2a = []
        cell2a.append(Paragraph(
            "<font name='Ubuntu-Bold'>%s:</font><seqreset"
            " id='counter'>" % _("Candidates"), stylesheet['Heading4']))
        cell2b = []
        for candidate in assignment.candidates:
            cell2b.append(Paragraph(
                "<seq id='counter'/>.&nbsp; %s" % candidate,
                stylesheet['Signaturefield']))
        if assignment.status == "sea":
            for x in range(0, 2 * assignment.posts):
                cell2b.append(
                    Paragraph(
                        "<seq id='counter'/>.&nbsp; "
                        "__________________________________________",
                        stylesheet['Signaturefield']))
        cell2b.append(Spacer(0, 0.2 * cm))

        # Vote results

        # Preparing
        vote_results = assignment.vote_results(only_published=True)
        polls = assignment.poll_set.filter(published=True)
        data_votes = []

        # Left side
        cell3a = []
        cell3a.append(Paragraph(
            "%s:" % (_("Vote results")), stylesheet['Heading4']))

        if polls.count() == 1:
            cell3a.append(Paragraph(
                "%s %s" % (polls.count(), _("ballot")), stylesheet['Normal']))
        elif polls.count() > 1:
            cell3a.append(Paragraph(
                "%s %s" % (polls.count(), _("ballots")), stylesheet['Normal']))

        # Add table head row
        headrow = []
        headrow.append(_("Candidates"))
        for poll in polls:
            headrow.append("%s." % poll.get_ballot())
        data_votes.append(headrow)

        # Add result rows
        elected_candidates = list(assignment.elected)
        for candidate, poll_list in vote_results.iteritems():
            row = []

            candidate_string = candidate.clean_name
            if candidate in elected_candidates:
                candidate_string = "* " + candidate_string
            if candidate.name_suffix:
                candidate_string += "\n(%s)" % candidate.name_suffix
            row.append(candidate_string)
            for vote in poll_list:
                if vote is None:
                    row.append('–')
                elif 'Yes' in vote and 'No' in vote and 'Abstain' in vote:
                    row.append(
                        _("Y: %(YES)s\nN: %(NO)s\nA: %(ABSTAIN)s")
                        % {'YES': vote['Yes'], 'NO': vote['No'],
                           'ABSTAIN': vote['Abstain']})
                elif 'Votes' in vote:
                    row.append(vote['Votes'])
                else:
                    pass
            data_votes.append(row)

        # Add votes invalid row
        footrow_one = []
        footrow_one.append(_("Invalid votes"))
        for poll in polls:
            footrow_one.append(poll.print_votesinvalid())
        data_votes.append(footrow_one)

        # Add votes cast row
        footrow_two = []
        footrow_two.append(_("Votes cast"))
        for poll in polls:
            footrow_two.append(poll.print_votescast())
        data_votes.append(footrow_two)

        table_votes = Table(data_votes)
        table_votes.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LINEABOVE', (0, 0), (-1, 0), 2, colors.black),
            ('LINEABOVE', (0, 1), (-1, 1), 1, colors.black),
            ('LINEBELOW', (0, -1), (-1, -1), 2, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), (colors.white, (.9, .9, .9)))]))

        # table
        data = []
        data.append([cell1a, cell1b])
        if polls:
            data.append([cell3a, table_votes])
            data.append(['', '* = ' + _('elected')])
        else:
            data.append([cell2a, cell2b])
        data.append([Spacer(0, 0.2 * cm), ''])
        t = Table(data)
        t._argW[0] = 4.5 * cm
        t._argW[1] = 11 * cm
        t.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
        story.append(t)
        story.append(Spacer(0, 1 * cm))

        # text
        story.append(Paragraph(
            "%s" % assignment.description.replace('\r\n',
            '<br/>'), stylesheet['Paragraph']))


class CreateRelatedAgendaItemView(_CreateRelatedAgendaItemView):
    """
    View to create and agenda item for an assignment.
    """
    model = Assignment


class AssignmentPollPDF(PDFView):
    permission_required = 'assignment.can_manage_assignment'
    top_space = 0

    def get(self, request, *args, **kwargs):
        self.poll = AssignmentPoll.objects.get(id=self.kwargs['poll_id'])
        return super(AssignmentPollPDF, self).get(request, *args, **kwargs)

    def get_filename(self):
        filename = u'%s-%s_%s' % (
            _("Election"), self.poll.assignment.name.replace(' ', '_'),
            self.poll.get_ballot())
        return filename

    def get_template(self, buffer):
        return SimpleDocTemplate(
            buffer, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0,
            showBoundary=False)

    def build_document(self, pdf_document, story):
        pdf_document.build(story)

    def append_to_pdf(self, story):
        imgpath = os.path.join(settings.SITE_ROOT, 'static/img/circle.png')
        circle = "<img src='%s' width='15' height='15'/>&nbsp;&nbsp;" % imgpath
        cell = []
        cell.append(Spacer(0, 0.8 * cm))
        cell.append(Paragraph(
            _("Election") + ": " + self.poll.assignment.name,
            stylesheet['Ballot_title']))
        cell.append(Paragraph(
            self.poll.assignment.polldescription,
            stylesheet['Ballot_subtitle']))
        options = self.poll.get_options()

        ballot_string = _("%d. ballot") % self.poll.get_ballot()
        candidate_string = ungettext(
            "%d candidate", "%d candidates", len(options)) % len(options)
        available_posts_string = ungettext(
            "%d available post", "%d available posts",
            self.poll.assignment.posts) % self.poll.assignment.posts
        cell.append(Paragraph(
            "%s, %s, %s" % (ballot_string, candidate_string,
            available_posts_string), stylesheet['Ballot_description']))
        cell.append(Spacer(0, 0.4 * cm))

        data = []
        # get ballot papers config values
        ballot_papers_selection = config["assignment_pdf_ballot_papers_selection"]
        ballot_papers_number = config["assignment_pdf_ballot_papers_number"]

        # set number of ballot papers
        if ballot_papers_selection == "NUMBER_OF_DELEGATES":
            try:
                if Group.objects.get(pk=3):
                    number = User.objects.filter(groups__pk=3).count()
            except Group.DoesNotExist:
                number = 0
        elif ballot_papers_selection == "NUMBER_OF_ALL_PARTICIPANTS":
            number = int(User.objects.count())
        else:  # ballot_papers_selection == "CUSTOM_NUMBER"
            number = int(ballot_papers_number)
        number = max(1, number)

        # Choose kind of ballot paper
        if self.poll.yesnoabstain:
            for option in options:
                candidate = option.candidate
                cell.append(Paragraph(
                    candidate.clean_name, stylesheet['Ballot_option_name']))
                if candidate.name_suffix:
                    cell.append(Paragraph(
                        "(%s)" % candidate.name_suffix,
                        stylesheet['Ballot_option_group']))
                else:
                    cell.append(Paragraph(
                        "&nbsp;", stylesheet['Ballot_option_group']))
                cell.append(Paragraph(
                    circle + _("Yes") + "&nbsp; " * 3 + circle
                    + _("No") + "&nbsp; " * 3 + circle + _("Abstention"),
                    stylesheet['Ballot_option_YNA']))
            # print ballot papers
            for user in xrange(number / 2):
                data.append([cell, cell])
            rest = number % 2
            if rest:
                data.append([cell, ''])
            if len(options) <= 2:
                t = Table(data, 10.5 * cm, 7.42 * cm)
            elif len(options) <= 5:
                t = Table(data, 10.5 * cm, 14.84 * cm)
            else:
                t = Table(data, 10.5 * cm, 29.7 * cm)
        else:
            for option in options:
                candidate = option.candidate
                cell.append(Paragraph(
                    circle + candidate.clean_name,
                    stylesheet['Ballot_option_name']))
                if candidate.name_suffix:
                    cell.append(Paragraph(
                        "(%s)" % candidate.name_suffix,
                        stylesheet['Ballot_option_group_right']))
                else:
                    cell.append(Paragraph(
                        "&nbsp;", stylesheet['Ballot_option_group_right']))
            # print ballot papers
            for user in xrange(number / 2):
                data.append([cell, cell])
            rest = number % 2
            if rest:
                data.append([cell, ''])
            if len(options) <= 4:
                t = Table(data, 10.5 * cm, 7.42 * cm)
            elif len(options) <= 8:
                t = Table(data, 10.5 * cm, 14.84 * cm)
            else:
                t = Table(data, 10.5 * cm, 29.7 * cm)

        t.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
        story.append(t)


def register_tab(request):
    selected = request.path.startswith('/assignment/')
    return Tab(
        title=_('Elections'),
        app='assignment',
        url=reverse('assignment_list'),
        permission=(
            request.user.has_perm('assignment.can_see_assignment') or
            request.user.has_perm('assignment.can_nominate_other') or
            request.user.has_perm('assignment.can_nominate_self') or
            request.user.has_perm('assignment.can_manage_assignment')),
        selected=selected,
    )


def get_widgets(request):
    return [Widget(
        request,
        name='assignments',
        display_name=_('Elections'),
        template='assignment/widget.html',
        context={'assignments': Assignment.objects.all()},
        permission_required='projector.can_manage_projector',
        default_column=1,
        default_weight=50)]
