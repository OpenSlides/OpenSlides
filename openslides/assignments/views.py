from cgi import escape

from django.contrib import messages
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.utils.translation import ungettext
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (PageBreak, Paragraph, SimpleDocTemplate, Spacer,
                                LongTable, Table, TableStyle)

from openslides.agenda.views import CreateRelatedAgendaItemView as _CreateRelatedAgendaItemView
from openslides.config.api import config
from openslides.users.models import Group, User  # TODO: remove this
from openslides.poll.views import PollFormView
from openslides.utils.pdf import stylesheet
from openslides.utils.rest_api import ModelViewSet, Response, ValidationError, detail_route
from openslides.utils.utils import html_strong
from openslides.utils.views import (CreateView, DeleteView, DetailView,
                                    ListView, PDFView,
                                    QuestionView, RedirectView,
                                    SingleObjectMixin, UpdateView)

from .forms import AssignmentForm, AssignmentRunForm
from .models import Assignment, AssignmentPoll
from .serializers import AssignmentFullSerializer, AssignmentShortSerializer


class AssignmentListView(ListView):
    """
    Lists all assignments.
    """
    required_permission = 'assignments.can_see'
    model = Assignment


class AssignmentDetail(DetailView):
    """
    Shows one assignment.
    """
    # TODO: use another view as 'run form' when updating this to angular
    required_permission = 'assignments.can_see'
    model = Assignment
    form_class = AssignmentRunForm

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        assignment = self.get_object()
        if self.request.method == 'POST':
            context['form'] = self.form_class(self.request.POST)
        else:
            context['form'] = self.form_class()

        polls = assignment.polls.all()
        if not self.request.user.has_perm('assignments.can_manage'):
            polls = polls.filter(published=True)
            vote_results = assignment.vote_results(only_published=True)
        else:
            polls = self.get_object().polls.all()
            vote_results = assignment.vote_results(only_published=False)

        context['polls'] = polls
        context['vote_results'] = vote_results
        context['blocked_candidates'] = assignment.blocked
        context['user_is_candidate'] = assignment.is_candidate(self.request.user)
        return context

    def post(self, *args, **kwargs):
        if self.request.user.has_perm('assignments.can_nominate_other'):
            assignment = self.get_object()
            form = self.form_class(self.request.POST)
            if form.is_valid():
                user = form.cleaned_data['candidate']
                if (assignment.phase == assignment.PHASE_SEARCH or
                        self.request.user.has_perm('assignments.can_manage')):
                    if (assignment.is_blocked(user) and
                            not self.request.user.has_perm('assignments.can_manage')):
                        messages.error(
                            self.request,
                            _("User %s does not want to be an candidate") % user)
                    elif assignment.is_elected(user):
                        messages.error(
                            self.request,
                            _("User %s is already elected") % html_strong(user))
                    elif assignment.is_candidate(user):
                        messages.error(
                            self.request,
                            _("User %s is already an candidate") % html_strong(user))
                    else:
                        assignment.set_candidate(user)
                        messages.success(
                            self.request,
                            _("User %s was nominated successfully.") % html_strong(user))
                else:
                    messages.error(
                        self.request,
                        _("You can not add candidates to this assignment"))
        return super(AssignmentDetail, self).get(*args, **kwargs)


class AssignmentCreateView(CreateView):
    required_permission = 'assignments.can_manage'
    model = Assignment
    form_class = AssignmentForm


class AssignmentUpdateView(UpdateView):
    required_permission = 'assignments.can_manage'
    model = Assignment
    form_class = AssignmentForm


class AssignmentDeleteView(DeleteView):
    required_permission = 'assignments.can_manage'
    model = Assignment
    success_url_name = 'assignment_list'


class AssignmentSetPhaseView(SingleObjectMixin, RedirectView):
    required_permission = 'assignments.can_manage'
    model = Assignment
    url_name = 'assignment_detail'

    def pre_redirect(self, *args, **kwargs):
        phase = int(kwargs.get('phase'))
        assignment = self.get_object()
        try:
            assignment.set_phase(phase)
        except ValueError as e:
            messages.error(self.request, e)
        else:
            assignment.save()
            messages.success(
                self.request,
                _('Election status was set to: %s.') %
                html_strong(assignment.get_phase_display()))


class AssignmentCandidateView(SingleObjectMixin, RedirectView):
    required_permission = 'assignments.can_nominate_self'
    model = Assignment
    url_name = 'assignment_detail'

    def pre_redirect(self, *args, **kwargs):
        assignment = self.get_object()
        if (assignment.phase == assignment.PHASE_SEARCH or
                self.request.user.has_perm('assignments.can_manage')):
            user = self.request.user
            if assignment.is_elected(user):
                messages.error(
                    self.request,
                    _("You are already elected"))
            elif assignment.is_candidate(user):
                messages.error(
                    self.request,
                    _("You are already an candidate"))
            else:
                assignment.set_candidate(user)
                messages.success(
                    self.request,
                    _("You were nominated successfully."))
        else:
            messages.error(
                self.request,
                _("You can not candidate to this assignment"))


class AssignmentDeleteCandidateshipView(SingleObjectMixin, RedirectView):
    required_permission = None  # Any user can withdraw his candidature
    model = Assignment
    url_name = 'assignment_detail'

    def pre_redirect(self, *args, **kwargs):
        assignment = self.get_object()
        if (assignment.phase == assignment.PHASE_SEARCH or
                self.request.user.has_perm('assignments.can_manage')):
            user = self.request.user
            assignment.set_blocked(user)
            messages.success(self.request, _(
                'You have withdrawn your candidature successfully. '
                'You can not be nominated by other participants anymore.'))
        else:
            messages.error(self.request, _('The candidate list is already closed.'))


class AssignmentDeleteCandidateshipOtherView(SingleObjectMixin, QuestionView):
    required_permission = 'assignments.can_manage'
    model = Assignment

    def get_question_message(self):
        self.user = User.objects.get(pk=self.kwargs.get('user_pk'))
        assignment = self.get_object()
        if assignment.is_blocked:
            question = _("Do you really want to unblock %s for the election?") % html_strong(self.user)
        else:
            question = _("Do you really want to withdraw %s from the election?") % html_strong(self.user)
        return question

    def on_clicked_yes(self):
        self.user = User.objects.get(pk=self.kwargs.get('user_pk'))
        assignment = self.get_object()
        if not assignment.is_elected(self.user):
            assignment.delete_related_user(self.user)
            self.error = False
        else:
            self.error = _("User %s is already elected") % html_strong(self.user)

    def create_final_message(self):
        if self.error:
            messages.error(self.request, self.error)
        else:
            messages.success(self.request, self.get_final_message())

    def get_final_message(self):
        return _("Candidate %s was withdrawn successfully.") % html_strong(self.user)


class AssignmentViewSet(ModelViewSet):
    """
    API endpoint to list, retrieve, create, update and destroy assignments and
    to manage candidatures.
    """
    queryset = Assignment.objects.all()

    def check_permissions(self, request):
        """
        Calls self.permission_denied() if the requesting user has not the
        permission to see assignments and in case of create, update or destroy
        requests the permission to manage assignments.
        """
        if (not request.user.has_perm('assignments.can_see') or
                (self.action in ('create', 'update', 'destroy') and not
                 request.user.has_perm('assignments.can_manage'))):
            self.permission_denied(request)

    def get_serializer_class(self):
        """
        Returns different serializer classes with respect to users permissions.
        """
        if self.request.user.has_perm('assignments.can_manage'):
            serializer_class = AssignmentFullSerializer
        else:
            serializer_class = AssignmentShortSerializer
        return serializer_class

    @detail_route(methods=['post', 'delete'])
    def candidature_self(self, request, pk=None):
        """
        View to nominate self as candidate (POST) or withdraw own candidature
        (DELETE).
        """
        if not request.user.has_perm('assignments.can_nominate_self'):
            self.permission_denied(request)
        assignment = self.get_object()
        if assignment.is_elected(request.user):
            raise ValidationError({'detail': _('You are already elected.')})
        if request.method == 'POST':
            message = self.nominate_self(request, assignment)
        else:
            # request.method == 'DELETE'
            message = self.withdraw_self(request, assignment)
        return Response({'detail': message})

    def nominate_self(self, request, assignment):
        if assignment.phase == assignment.PHASE_FINISHED:
            raise ValidationError({'detail': _('You can not candidate to this election because it is finished.')})
        if assignment.phase == assignment.PHASE_VOTING and not request.user.has_perm('assignments.can_manage'):
            # To nominate self during voting you have to be a manager.
            self.permission_denied(request)
        # If the request.user is already a candidate he can nominate himself nevertheless.
        assignment.set_candidate(request.user)
        return _('You were nominated successfully.')

    def withdraw_self(self, request, assignment):
        # Withdraw candidature and set self blocked.
        if assignment.phase == assignment.PHASE_FINISHED:
            raise ValidationError({'detail': _('You can not withdraw your candidature to this election because it is finished.')})
        if assignment.phase == assignment.PHASE_VOTING and not request.user.has_perm('assignments.can_manage'):
            # To withdraw self during voting you have to be a manager.
            self.permission_denied(request)
        if not assignment.is_candidate(request.user):
            raise ValidationError({'detail': _('You are not a candidate of this election.')})
        assignment.set_blocked(request.user)
        return _(
            'You have withdrawn your candidature successfully. '
            'You can not be nominated by other participants anymore.')

    def get_user_from_request_data(self, request):
        """
        Helper method to get a specific user from request data (not the
        request.user) so that the views self.candidature_other or
        self.mark_elected can play with him.
        """
        if not isinstance(request.data, dict):
            detail = _('Invalid data. Expected dictionary, got %s.') % type(request.data)
            raise ValidationError({'detail': detail})
        user_str = request.data.get('user', '')
        try:
            user_pk = int(user_str)
        except ValueError:
            raise ValidationError({'detail': _('Invalid data. Expected something like {"user": <id>}.')})
        try:
            user = User.objects.get(pk=user_pk)
        except User.DoesNotExist:
            raise ValidationError({'detail': _('Invalid data. User %d does not exist.') % user_pk})
        return user

    @detail_route(methods=['post', 'delete'])
    def candidature_other(self, request, pk=None):
        """
        View to nominate other users (POST) or delete their candidature
        status (DELETE). The client has to send {'user': <id>}.
        """
        if not request.user.has_perm('assignments.can_nominate_other'):
            self.permission_denied(request)
        user = self.get_user_from_request_data(request)
        assignment = self.get_object()
        if assignment.is_elected(user):
            raise ValidationError({'detail': _('User %s is already elected.') % user})
        if request.method == 'POST':
            message = self.nominate_other(request, user, assignment)
        else:
            # request.method == 'DELETE'
            message = self.delete_other(request, user, assignment)
        return Response({'detail': message})

    def nominate_other(self, request, user, assignment):
        if assignment.phase == assignment.PHASE_FINISHED:
            detail = _('You can not nominate someone to this election because it is finished.')
            raise ValidationError({'detail': detail})
        if assignment.phase == assignment.PHASE_VOTING and not request.user.has_perm('assignments.can_manage'):
            # To nominate other during voting you have to be a manager.
            self.permission_denied(request)
        if not request.user.has_perm('assignments.can_manage'):
            if assignment.is_blocked(user):
                raise ValidationError({'detail': _('User %s does not want to be an candidate.') % user})
            if assignment.is_elected(user):
                raise ValidationError({'detail': _('User %s is already elected.') % user})
        # If the user is already a candidate he can be nominated nevertheless.
        assignment.set_candidate(user)
        return _('User %s was nominated successfully.') % user

    def delete_other(self, request, user, assignment):
        # To delete candidature status you have to be a manager.
        if not request.user.has_perm('assignments.can_manage'):
            self.permission_denied(request)
        if assignment.phase == assignment.PHASE_FINISHED:
            detail = _('You can not delete someones candidature to this election because it is finished.')
            raise ValidationError({'detail': detail})
        if not assignment.is_candidate(user) and not assignment.is_blocked(user):
            raise ValidationError({'detail': _('User %s has no status in this election.') % user})
        assignment.delete_related_user(user)
        return _('Candidate %s was withdrawn/unblocked successfully.') % user

    @detail_route(methods=['post', 'delete'])
    def mark_elected(self, request, pk=None):
        """
        View to mark other users as elected (POST) undo this (DELETE). The
        client has to send {'user': <id>}.
        """
        if not request.user.has_perm('assignments.can_manage'):
            self.permission_denied(request)
        user = self.get_user_from_request_data(request)
        assignment = self.get_object()
        if request.method == 'POST':
            if not assignment.is_candidate(user):
                raise ValidationError({'detail': _('User %s is not a candidate of this election.') % user})
            assignment.set_elected(user)
            message = _('User %s was successfully elected.') % user
        else:
            # request.method == 'DELETE'
            if not assignment.is_elected(user):
                detail = _('User %s is not an elected candidate of this election.') % user
                raise ValidationError({'detail': detail})
            assignment.set_candidate(user)
            message = _('User %s was successfully unelected.') % user
        return Response({'detail': message})


class PollCreateView(SingleObjectMixin, RedirectView):
    required_permission = 'assignments.can_manage'
    model = Assignment
    url_name = 'assignment_detail'

    def pre_redirect(self, *args, **kwargs):
        self.get_object().create_poll()
        messages.success(self.request, _("New ballot was successfully created."))


class PollUpdateView(PollFormView):
    required_permission = 'assignments.can_manage'
    poll_class = AssignmentPoll
    template_name = 'assignments/assignmentpoll_form.html'

    def get_context_data(self, **kwargs):
        context = super(PollUpdateView, self).get_context_data(**kwargs)
        self.assignment = self.poll.get_assignment()
        context['assignment'] = self.assignment
        context['poll'] = self.poll
        context['polls'] = self.assignment.polls.all()
        context['ballotnumber'] = self.poll.get_ballot()
        return context

    def get_success_url(self):
        if 'apply' not in self.request.POST:
            return_url = reverse('assignment_detail', args=[self.poll.assignment.id])
        else:
            return_url = ''
        return return_url


class SetPublishPollView(SingleObjectMixin, RedirectView):
    required_permission = 'assignments.can_manage'
    model = AssignmentPoll
    url_name = 'assignment_detail'
    allow_ajax = True
    publish = False

    def get_ajax_context(self, **context):
        return super().get_ajax_context(
            published=self.object.published,
            **context)

    def pre_redirect(self, *args, **kwargs):
        poll = self.get_object()
        poll.set_published(kwargs['publish'])


class SetElectedView(SingleObjectMixin, RedirectView):
    required_permission = 'assignments.can_manage'
    model = Assignment
    url_name = 'assignment_detail'
    allow_ajax = True

    def pre_redirect(self, *args, **kwargs):
        self.person = User.objects.get(pk=kwargs['user_id'])
        self.elected = kwargs['elected']
        # TODO: un-elect users if self.elected is False
        self.get_object().set_elected(self.person)

    def get_ajax_context(self, **kwargs):
        if self.elected:
            link = reverse('assignment_user_not_elected',
                           args=[self.get_object().id, self.person.person_id])
            text = _('not elected')
        else:
            link = reverse('assignment_user_elected',
                           args=[self.get_object().id, self.person.person_id])
            text = _('elected')
        return {'elected': self.elected, 'link': link, 'text': text}


class AssignmentPollDeleteView(DeleteView):
    """
    Delete an assignment poll object.
    """
    required_permission = 'assignments.can_manage'
    model = AssignmentPoll

    def pre_redirect(self, request, *args, **kwargs):
        self.set_assignment()
        super().pre_redirect(request, *args, **kwargs)

    def pre_post_redirect(self, request, *args, **kwargs):
        self.set_assignment()
        super().pre_post_redirect(request, *args, **kwargs)

    def set_assignment(self):
        self.assignment = self.get_object().assignment

    def get_redirect_url(self, **kwargs):
        return reverse('assignment_detail', args=[self.assignment.id])

    def get_final_message(self):
        return _('Ballot was successfully deleted.')


class AssignmentPDF(PDFView):
    required_permission = 'assignments.can_see'
    top_space = 0

    def get_filename(self):
        try:
            assignment = Assignment.objects.get(pk=self.kwargs['pk'])
            filename = u'%s-%s' % (
                _("Assignment"),
                assignment.title.replace(' ', '_'))
        except:
            filename = _("Elections")
        return filename

    def append_to_pdf(self, story):
        try:
            assignment_pk = self.kwargs['pk']
        except KeyError:
            assignment_pk = None

        if assignment_pk is None:  # print all assignments
            title = escape(config["assignment_pdf_title"])
            story.append(Paragraph(title, stylesheet['Heading1']))
            preamble = escape(config["assignment_pdf_preamble"])
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
                        escape(assignment.title), stylesheet['Heading3']))
                # Assignment details (each assignment on single page)
                for assignment in assignments:
                    story.append(PageBreak())
                    # append the assignment to the story-object
                    self.get_assignment(assignment, story)
        else:  # print selected assignment
            assignment = Assignment.objects.get(pk=assignment_pk)
            # append the assignment to the story-object
            self.get_assignment(assignment, story)

    def get_assignment(self, assignment, story):
        # title
        story.append(Paragraph(
            _("Election: %s") % escape(assignment.title), stylesheet['Heading1']))
        story.append(Spacer(0, 0.5 * cm))

        # Filling table rows...
        data = []
        polls = assignment.polls.filter(published=True)
        # 1. posts
        data.append([
            Paragraph("%s:" %
                      _("Number of members to be elected"), stylesheet['Bold']),
            Paragraph(str(assignment.open_posts), stylesheet['Paragraph'])])

        # 2a. if no polls available print candidates
        if not polls:
            data.append([
                Paragraph("%s:<seqreset id='counter'>" %
                          _("Candidates"), stylesheet['Heading4']),
                []])
            for candidate in assignment.candidates:
                data.append([
                    [],
                    Paragraph("<seq id='counter'/>.&nbsp; %s" % candidate,
                              stylesheet['Signaturefield'])])
            if assignment.phase == assignment.PHASE_SEARCH:
                for x in range(0, 7):
                    data.append([
                        [],
                        Paragraph("<seq id='counter'/>.&nbsp; "
                                  "__________________________________________",
                                  stylesheet['Signaturefield'])])

        # 2b. if polls available print election result
        if polls:
            # Preparing
            vote_results = assignment.vote_results(only_published=True)
            data_votes = []

            # Left side
            cell = []
            cell.append(Paragraph(
                "%s:" % (_("Election result")), stylesheet['Heading4']))

            # Add table head row
            headrow = []
            headrow.append(_("Candidates"))
            for poll in polls:
                headrow.append("%s. %s" % (poll.get_ballot(), _("ballot")))
            data_votes.append(headrow)

            # Add result rows
            elected_candidates = list(assignment.elected)
            length = len(vote_results)
            for candidate, poll_list in vote_results.iteritems():
                row = []
                candidate_string = candidate.clean_name
                if candidate in elected_candidates:
                    candidate_string = "* " + candidate_string
                if candidate.name_suffix and length < 20:
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

            # Add valid votes row
            footrow_one = []
            footrow_one.append(_("Valid votes"))
            votesvalid_is_used = False
            for poll in polls:
                footrow_one.append(poll.print_votesvalid())
                if poll.votesvalid is not None:
                    votesvalid_is_used = True
            if votesvalid_is_used:
                data_votes.append(footrow_one)

            # Add invalid votes row
            footrow_two = []
            footrow_two.append(_("Invalid votes"))
            votesinvalid_is_used = False
            for poll in polls:
                footrow_two.append(poll.print_votesinvalid())
                if poll.votesinvalid is not None:
                    votesinvalid_is_used = True
            if votesinvalid_is_used:
                data_votes.append(footrow_two)

            # Add votes cast row
            footrow_three = []
            footrow_three.append(_("Votes cast"))
            votescast_is_used = False
            for poll in polls:
                footrow_three.append(poll.print_votescast())
                if poll.votescast is not None:
                    votescast_is_used = True
            if votescast_is_used:
                data_votes.append(footrow_three)

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
            data.append([cell, table_votes])
            if elected_candidates:
                data.append(['', '* = ' + _('elected')])

        # table style
        data.append(['', ''])
        t = LongTable(data)
        t._argW[0] = 4.5 * cm
        t._argW[1] = 11 * cm
        t.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
        story.append(t)
        story.append(Spacer(0, 1 * cm))

        # election description
        story.append(
            Paragraph("%s" % escape(assignment.description).replace('\r\n', '<br/>'),
                      stylesheet['Paragraph']))


class CreateRelatedAgendaItemView(_CreateRelatedAgendaItemView):
    """
    View to create and agenda item for an assignment.
    """
    model = Assignment


class AssignmentPollPDF(PDFView):
    required_permission = 'assignments.can_manage'
    top_space = 0

    def get(self, request, *args, **kwargs):
        self.poll = AssignmentPoll.objects.get(pk=self.kwargs['poll_pk'])
        return super().get(request, *args, **kwargs)

    def get_filename(self):
        filename = u'%s-%s_%s' % (
            _("Election"), self.poll.assignment.title.replace(' ', '_'),
            self.poll.get_ballot())
        return filename

    def get_template(self, buffer):
        return SimpleDocTemplate(
            buffer, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0,
            showBoundary=False)

    def build_document(self, pdf_document, story):
        pdf_document.build(story)

    def append_to_pdf(self, story):
        circle = "*"  # = Unicode Character 'HEAVY LARGE CIRCLE' (U+2B55)
        cell = []
        cell.append(Spacer(0, 0.8 * cm))
        cell.append(Paragraph(
            _("Election") + ": " + self.poll.assignment.title,
            stylesheet['Ballot_title']))
        cell.append(Paragraph(
            self.poll.description or '',
            stylesheet['Ballot_subtitle']))
        options = self.poll.get_options()

        ballot_string = _("%d. ballot") % self.poll.get_ballot()
        candidate_string = ungettext(
            "%d candidate", "%d candidates", len(options)) % len(options)
        available_posts_string = ungettext(
            "%d available post", "%d available posts",
            self.poll.assignment.open_posts) % self.poll.assignment.open_posts
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

        counter = 0
        cellcolumnA = []
        # Choose kind of ballot paper (YesNoAbstain or Yes)
        if self.poll.yesnoabstain:  # YesNoAbstain ballot: max 27 candidates
            for option in options:
                counter += 1
                candidate = option.candidate
                cell.append(Paragraph(
                    candidate.get_short_name(), stylesheet['Ballot_option_name_YNA']))
                if candidate.structure_level:
                    cell.append(Paragraph(
                        "(%s)" % candidate.structure_level,
                        stylesheet['Ballot_option_suffix_YNA']))
                else:
                    cell.append(Paragraph(
                        "&nbsp;", stylesheet['Ballot_option_suffix_YNA']))
                cell.append(Paragraph("<font name='circlefont' size='15'>%(circle)s</font> \
                    <font name='Ubuntu'>%(yes)s &nbsp;&nbsp;&nbsp;</font> \
                    <font name='circlefont' size='15'>%(circle)s</font> \
                    <font name='Ubuntu'>%(no)s &nbsp;&nbsp;&nbsp;</font> \
                    <font name='circlefont' size='15'>%(circle)s</font> \
                    <font name='Ubuntu'>%(abstain)s</font>" %
                            {'circle': circle,
                             'yes': _("Yes"),
                             'no': _("No"),
                             'abstain': _("Abstention")},
                            stylesheet['Ballot_option_circle_YNA']))
                if counter == 13:
                    cellcolumnA = cell
                    cell = []
                    cell.append(Spacer(0, 1.3 * cm))

            # print ballot papers
            for user in range(number // 2):
                if len(options) > 13:
                    data.append([cellcolumnA, cell])
                else:
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
        else:  # Yes ballot: max 46 candidates
            for option in options:
                counter += 1
                candidate = option.candidate
                cell.append(Paragraph("<font name='circlefont' size='15'>%s</font> \
                            <font name='Ubuntu'>%s</font>" %
                            (circle, candidate.clean_name), stylesheet['Ballot_option_name']))
                if candidate.structure_level:
                    cell.append(Paragraph(
                        "(%s)" % candidate.structure_level,
                        stylesheet['Ballot_option_suffix']))
                else:
                    cell.append(Paragraph(
                        "&nbsp;", stylesheet['Ballot_option_suffix']))
                if counter == 22:
                    cellcolumnA = cell
                    cell = []
                    cell.append(Spacer(0, 0.75 * cm))

            # print ballot papers
            for user in range(number // 2):
                if len(options) > 22:
                    data.append([cellcolumnA, cell])
                else:
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
