from html import escape

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.translation import ugettext as _
from django.utils.translation import ungettext
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    LongTable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from openslides.assignments.access_permissions import AccessPermissions
from openslides.core.config import config
from openslides.utils.pdf import stylesheet
from openslides.utils.rest_api import (
    DestroyModelMixin,
    GenericViewSet,
    ModelViewSet,
    Response,
    UpdateModelMixin,
    ValidationError,
    detail_route,
)
from openslides.utils.views import PDFView

from .models import Assignment, AssignmentPoll
from .serializers import (
    AssignmentAllPollSerializer,
    AssignmentFullSerializer,
    AssignmentShortSerializer,
)


# Viewsets for the REST API

class AssignmentViewSet(ModelViewSet):
    """
    API endpoint for assignments.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update, destroy, candidature_self, candidature_other,
    mark_elected and create_poll.
    """
    queryset = Assignment.objects.all()
    access_permissions = AccessPermissions()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action == 'retrieve':
            result = self.access_permissions.can_retrieve(self.request.user)
        elif self.action in ('metadata', 'list'):
            result = self.request.user.has_perm('assignments.can_see')
        elif self.action in ('create', 'partial_update', 'update', 'destroy',
                             'mark_elected', 'create_poll'):
            result = (self.request.user.has_perm('assignments.can_see') and
                      self.request.user.has_perm('assignments.can_manage'))
        elif self.action == 'candidature_self':
            result = (self.request.user.has_perm('assignments.can_see') and
                      self.request.user.has_perm('assignments.can_nominate_self'))
        elif self.action == 'candidature_other':
            result = (self.request.user.has_perm('assignments.can_see') and
                      self.request.user.has_perm('assignments.can_nominate_other'))
        else:
            result = False
        return result

    @detail_route(methods=['post', 'delete'])
    def candidature_self(self, request, pk=None):
        """
        View to nominate self as candidate (POST) or withdraw own
        candidature (DELETE).
        """
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
        # Withdraw candidature.
        if assignment.phase == assignment.PHASE_FINISHED:
            raise ValidationError({'detail': _('You can not withdraw your candidature to this election because it is finished.')})
        if assignment.phase == assignment.PHASE_VOTING and not request.user.has_perm('assignments.can_manage'):
            # To withdraw self during voting you have to be a manager.
            self.permission_denied(request)
        if not assignment.is_candidate(request.user):
            raise ValidationError({'detail': _('You are not a candidate of this election.')})
        assignment.delete_related_user(request.user)
        return _('You have withdrawn your candidature successfully.')

    def get_user_from_request_data(self, request):
        """
        Helper method to get a specific user from request data (not the
        request.user) so that the views self.candidature_other or
        self.mark_elected can play with it.
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
            user = get_user_model().objects.get(pk=user_pk)
        except get_user_model().DoesNotExist:
            raise ValidationError({'detail': _('Invalid data. User %d does not exist.') % user_pk})
        return user

    @detail_route(methods=['post', 'delete'])
    def candidature_other(self, request, pk=None):
        """
        View to nominate other users (POST) or delete their candidature
        status (DELETE). The client has to send {'user': <id>}.
        """
        user = self.get_user_from_request_data(request)
        assignment = self.get_object()
        if request.method == 'POST':
            message = self.nominate_other(request, user, assignment)
        else:
            # request.method == 'DELETE'
            message = self.delete_other(request, user, assignment)
        return Response({'detail': message})

    def nominate_other(self, request, user, assignment):
        if assignment.is_elected(user):
            raise ValidationError({'detail': _('User %s is already elected.') % user})
        if assignment.phase == assignment.PHASE_FINISHED:
            detail = _('You can not nominate someone to this election because it is finished.')
            raise ValidationError({'detail': detail})
        if assignment.phase == assignment.PHASE_VOTING and not request.user.has_perm('assignments.can_manage'):
            # To nominate another user during voting you have to be a manager.
            self.permission_denied(request)
        if assignment.is_candidate(user):
            raise ValidationError({'detail': _('User %s is already nominated.') % user})
        assignment.set_candidate(user)
        return _('User %s was nominated successfully.') % user

    def delete_other(self, request, user, assignment):
        # To delete candidature status you have to be a manager.
        if not request.user.has_perm('assignments.can_manage'):
            self.permission_denied(request)
        if assignment.phase == assignment.PHASE_FINISHED:
            detail = _("You can not delete someone's candidature to this election because it is finished.")
            raise ValidationError({'detail': detail})
        if not assignment.is_candidate(user) and not assignment.is_elected(user):
            raise ValidationError({'detail': _('User %s has no status in this election.') % user})
        assignment.delete_related_user(user)
        return _('Candidate %s was withdrawn successfully.') % user

    @detail_route(methods=['post', 'delete'])
    def mark_elected(self, request, pk=None):
        """
        View to mark other users as elected (POST) or undo this (DELETE).
        The client has to send {'user': <id>}.
        """
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

    @detail_route(methods=['post'])
    def create_poll(self, request, pk=None):
        """
        View to create a poll. It is a POST request without any data.
        """
        assignment = self.get_object()
        if not assignment.candidates.exists():
            raise ValidationError({'detail': _('Can not create ballot because there are no candidates.')})
        with transaction.atomic():
            assignment.create_poll()
        return Response({'detail': _('Ballot created successfully.')})


class AssignmentPollViewSet(UpdateModelMixin, DestroyModelMixin, GenericViewSet):
    """
    API endpoint for assignment polls.

    There are the following views: update and destroy.
    """
    queryset = AssignmentPoll.objects.all()
    serializer_class = AssignmentAllPollSerializer

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        return (self.request.user.has_perm('assignments.can_see') and
                self.request.user.has_perm('assignments.can_manage'))


# Views to generate PDFs

class AssignmentPDF(PDFView):
    required_permission = 'assignments.can_see'
    top_space = 0

    def get_filename(self):
        try:
            assignment = Assignment.objects.get(pk=self.kwargs['pk'])
            filename = u'%s-%s' % (
                _("Election"),
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
            title = escape(config["assignments_pdf_title"])
            story.append(Paragraph(title, stylesheet['Heading1']))
            preamble = escape(config["assignments_pdf_preamble"])
            if preamble:
                story.append(Paragraph(
                    "%s" % preamble.replace('\r\n', '<br/>'),
                    stylesheet['Paragraph']))
            story.append(Spacer(0, 0.75 * cm))
            assignments = Assignment.objects.all()
            if not assignments:  # No assignments existing
                story.append(Paragraph(
                    _("No elections available."), stylesheet['Heading3']))
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
            for candidate, poll_list in vote_results.items():
                row = []
                candidate_string = candidate.get_short_name()
                if candidate in elected_candidates:
                    candidate_string = "* " + candidate_string
                if candidate.structure_level and length < 20:
                    candidate_string += "\n(%s)" % candidate.structure_level
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
        ballot_papers_selection = config["assignments_pdf_ballot_papers_selection"]
        ballot_papers_number = config["assignments_pdf_ballot_papers_number"]

        # set number of ballot papers
        if ballot_papers_selection == "NUMBER_OF_DELEGATES":
            if 'openslides.users' in settings.INSTALLED_APPS:
                from openslides.users.models import Group
                try:
                    if Group.objects.get(pk=3):
                        number = get_user_model().objects.filter(groups__pk=3).count()
                except Group.DoesNotExist:
                    number = 0
            else:
                number = 0
        elif ballot_papers_selection == "NUMBER_OF_ALL_PARTICIPANTS":
            number = int(get_user_model().objects.count())
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
                             'abstain': _("Abstain")},
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
                            (circle, candidate.get_short_name()), stylesheet['Ballot_option_name']))
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
