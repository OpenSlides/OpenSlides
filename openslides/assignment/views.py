# -*- coding: utf-8 -*-

import os

from django.conf import settings
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.shortcuts import redirect
from django.utils.translation import ugettext as _
from django.utils.translation import ungettext
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (PageBreak, Paragraph, SimpleDocTemplate, Spacer,
                                Table, TableStyle)

from openslides.agenda.views import CreateRelatedAgendaItemView as _CreateRelatedAgendaItemView
from openslides.config.api import config
from openslides.participant.models import Group, User
from openslides.poll.views import PollFormView
from openslides.projector.projector import Widget
from openslides.utils.pdf import stylesheet
from openslides.utils.person import get_person
from openslides.utils.template import Tab
from openslides.utils.utils import html_strong
from openslides.utils.views import (CreateView, DeleteView, DetailView,
                                    ListView, PDFView, PermissionMixin,
                                    QuestionView, RedirectView,
                                    SingleObjectMixin, UpdateView, View)

from .forms import AssignmentForm, AssignmentRunForm
from .models import Assignment, AssignmentPoll


class AssignmentListView(ListView):
    """ListView for all Assignments"""
    permission_required = 'assignment.can_see_assignment'
    model = Assignment


class AssignmentDetail(DetailView):
    permission_required = 'assignment.can_see_assignment'
    model = Assignment
    form_class = AssignmentRunForm

    def get_context_data(self, *args, **kwargs):
        context = super(AssignmentDetail, self).get_context_data(*args, **kwargs)
        if self.request.method == 'POST':
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
        context['user_is_candidate'] = self.object.is_candidate(self.request.user)
        return context

    def post(self, *args, **kwargs):
        self.object = self.get_object()
        if self.request.user.has_perm('assignment.can_nominate_other'):
            form = self.form_class(self.request.POST)
            if form.is_valid():
                user = form.cleaned_data['candidate']
                try:
                    self.object.run(user, self.request.user)
                except NameError, e:
                    messages.error(self.request, e)
                else:
                    messages.success(self.request, _(
                        "Candidate %s was nominated successfully.")
                        % html_strong(user))
        return super(AssignmentDetail, self).get(*args, **kwargs)


class AssignmentCreateView(CreateView):
    model = Assignment
    form_class = AssignmentForm
    permission_required = 'assignment.can_manage_assignment'


class AssignmentUpdateView(UpdateView):
    model = Assignment
    form_class = AssignmentForm
    permission_required = 'assignment.can_manage_assignment'


class AssignmentDeleteView(DeleteView):
    permission_required = 'assignment.can_manage_assignment'
    model = Assignment
    success_url_name = 'assignment_list'


class AssignmentSetStatusView(SingleObjectMixin, RedirectView):
    model = Assignment
    permission_required = 'assignment.can_manage_assignment'
    url_name = 'assignment_detail'

    def pre_redirect(self, *args, **kwargs):
        self.object = self.get_object()
        status = kwargs.get('status')
        if status is not None:
            try:
                self.object.set_status(status)
            except ValueError, e:
                messages.error(self.request, e)
            else:
                messages.success(
                    self.request,
                    _('Election status was set to: %s.') %
                    html_strong(self.object.get_status_display())
                )


class AssignmentRunView(SingleObjectMixin, PermissionMixin, View):
    model = Assignment
    permission_required = 'assignment.can_nominate_self'

    def get(self, *args, **kwargs):
        assignment = self.get_object()
        try:
            assignment.run(self.request.user, self.request.user)
        except NameError, e:
            messages.error(self.request, e)
        else:
            messages.success(
                self.request, _('You have set your candidature successfully.'))
        return redirect(reverse('assignment_detail', args=[assignment.pk]))


class AssignmentRunDeleteView(SingleObjectMixin, RedirectView):
    model = Assignment
    url_name = 'assignment_detail'

    def pre_redirect(self, *args, **kwargs):
        self.object = self.get_object()
        if self.object.status == 'sea' or self.request.user.has_perm(
                "assignment.can_manage_assignment"):
            try:
                self.object.delrun(self.request.user, blocked=True)
            except Exception, e:
                messages.error(self.request, e)
            else:
                messages.success(self.request, _(
                    'You have withdrawn your candidature successfully. '
                    'You can not be nominated by other participants anymore.'))
        else:
            messages.error(self.request, _('The candidate list is already closed.'))


class AssignmentRunOtherDeleteView(SingleObjectMixin, QuestionView):
    model = Assignment
    permission_required = 'assignment.can_manage_assignment'

    def get_question_message(self):
        self._get_person_information()
        if not self.is_blocked:
            question = _("Do you really want to withdraw %s from the election?") % html_strong(self.person)
        else:
            question = _("Do you really want to unblock %s for the election?") % html_strong(self.person)
        return question

    def on_clicked_yes(self):
        self._get_person_information()
        try:
            self.object.delrun(self.person, blocked=False)
        except Exception, e:
            self.error = e
        else:
            self.error = False

    def create_final_message(self):
        if self.error:
            messages.error(self.request, self.error)
        else:
            messages.success(self.request, self.get_final_message())

    def get_final_message(self):
        message = _("Candidate %s was withdrawn successfully.") % html_strong(self.person)
        if self.is_blocked:
            message = _("%s was unblocked successfully.") % html_strong(self.person)
        return message

    def _get_person_information(self):
        self.object = self.get_object()
        self.person = get_person(self.kwargs.get('user_id'))
        self.is_blocked = self.object.is_blocked(self.person)


class PollCreateView(SingleObjectMixin, RedirectView):
    model = Assignment
    permission_required = 'assignment.can_manage_assignment'
    url_name = 'assignment_poll_view'

    def pre_redirect(self, *args, **kwargs):
        self.object = self.get_object().gen_poll()
        messages.success(self.request, _("New ballot was successfully created."))


class PollUpdateView(PollFormView):
    poll_class = AssignmentPoll
    template_name = 'assignment/poll_view.html'

    def get_context_data(self, **kwargs):
        context = super(PollUpdateView, self).get_context_data(**kwargs)
        self.assignment = self.poll.get_assignment()
        context['assignment'] = self.assignment
        context['poll'] = self.poll
        context['polls'] = self.assignment.poll_set.filter(assignment=self.assignment)
        context['ballotnumber'] = self.poll.get_ballot()
        return context

    def get_success_url(self):
        return_url = ''
        if not 'apply' in self.request.POST:
            return_url = reverse('assignment_detail', args=[self.poll.assignment.id])
        return return_url


class SetPublishStatusView(SingleObjectMixin, RedirectView):
    model = AssignmentPoll
    permission_required = 'assignment.can_manage_assignment'
    url_name = 'assignment_detail'
    allow_ajax = True

    def get_ajax_context(self, **kwargs):
        return {'published': self.object.published}

    def pre_redirect(self, *args, **kwargs):
        try:
            self.object = self.get_object()
        except self.model.DoesNotExist:
            messages.error(self.request, _('Ballot ID %d does not exist.') %
                           int(kwargs['poll_id']))
        else:
            if self.object.published:
                self.object.set_published(False)
            else:
                self.object.set_published(True)


class SetElectedView(SingleObjectMixin, RedirectView):
    model = Assignment
    permission_required = 'assignment.can_manage_assignment'
    url_name = 'assignment_detail'
    allow_ajax = True

    def pre_redirect(self, *args, **kwargs):
        self.object = self.get_object()
        self.person = get_person(kwargs['user_id'])
        self.elected = kwargs['elected']
        self.object.set_elected(self.person, self.elected)

    def get_ajax_context(self, **kwargs):
        if self.elected:
            link = reverse('assignment_user_not_elected',
                           args=[self.object.id, self.person.person_id])
            text = _('not elected')
        else:
            link = reverse('assignment_user_elected',
                           args=[self.object.id, self.person.person_id])
            text = _('elected')
        return {'elected': self.elected, 'link': link, 'text': text}


class AssignmentPollDeleteView(DeleteView):
    """
    Delete an assignment poll object.
    """
    permission_required = 'assignment.can_manage_assignment'
    model = AssignmentPoll

    def pre_redirect(self, request, *args, **kwargs):
        self.set_assignment()
        super(AssignmentPollDeleteView, self).pre_redirect(request, *args, **kwargs)

    def pre_post_redirect(self, request, *args, **kwargs):
        self.set_assignment()
        super(AssignmentPollDeleteView, self).pre_post_redirect(request, *args, **kwargs)

    def set_assignment(self):
        self.assignment = self.object.assignment

    def get_redirect_url(self, **kwargs):
        return reverse('assignment_detail', args=[self.assignment.id])

    def get_final_message(self):
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
        table_votes.setStyle(
            TableStyle([
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LINEABOVE', (0, 0), (-1, 0), 2, colors.black),
                ('LINEABOVE', (0, 1), (-1, 1), 1, colors.black),
                ('LINEBELOW', (0, -1), (-1, -1), 2, colors.black),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), (colors.white, (.9, .9, .9)))
            ])
        )

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
        story.append(
            Paragraph("%s" % assignment.description.replace('\r\n', '<br/>'),
                      stylesheet['Paragraph']))


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
            "%s, %s, %s" % (ballot_string, candidate_string, available_posts_string),
            stylesheet['Ballot_description']))
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
