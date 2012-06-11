#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.assignment.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the assignment app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import os

from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, PageBreak, Paragraph, Spacer, Table, TableStyle

from django.shortcuts import redirect
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.utils.translation import ungettext, ugettext as _

from config.models import config
from settings import SITE_ROOT

from utils.utils import template, permission_required, gen_confirm_form, del_confirm_form, ajax_request
from utils.pdf import stylesheet
from utils.views import FormView, DeleteView, PDFView
from utils.template import Tab

from projector.api import get_model_widget

from poll.views import PollFormView

from assignment.models import Assignment, AssignmentPoll, AssignmentOption
from assignment.forms import AssignmentForm, AssignmentRunForm, ConfigForm

from participant.models import Profile


@permission_required('assignment.can_see_assignment')
@template('assignment/overview.html')
def get_overview(request):
    query = Assignment.objects
    if 'status' in request.GET and '---' not in request.GET['status']:
        query = query.filter(status__iexact=request.GET['status'])
    try:
        sort = request.GET['sort']
        if sort in ['name','status']:
            query = query.order_by(sort)
    except KeyError:
        query = query.order_by('name')
    if 'reverse' in request.GET:
        query = query.reverse()

    assignments = query.all()
    return {
        'assignments': assignments,
    }


@permission_required('assignment.can_see_assignment')
@template('assignment/view.html')
def view(request, assignment_id=None):
    form = None
    assignment = Assignment.objects.get(pk=assignment_id)
    if request.method == 'POST':
        if request.user.has_perm('assignment.can_nominate_other'):
            form = AssignmentRunForm(request.POST)
            if form.is_valid():
                user = form.cleaned_data['candidate']
                try:
                    assignment.run(user)
                    messages.success(request, _("Candidate <b>%s</b> was nominated successfully.") % (user))
                except NameError, e:
                    messages.error(request, e)
    else:
        if request.user.has_perm('assignment.can_nominate_other'):
            form = AssignmentRunForm()

    polls = assignment.poll_set.all()
    votes = []
    for candidate in assignment.candidates:
        tmplist = ((candidate, assignment.is_elected(candidate)), [])
        for poll in polls:
            if (poll.published and not request.user.has_perm('assignment.can_manage_assignment')) or request.user.has_perm('assignment.can_manage_assignment'):
                # candidate exists in poll
                if poll.get_options().filter(candidate=candidate).exists():
                    option = AssignmentOption.objects.filter(poll=poll).get(candidate=candidate)
                    try:
                        tmplist[1].append(option.get_votes()[0])
                    except IndexError:
                        tmplist[1].append('–')
                else:
                    tmplist[1].append("-")
        votes.append(tmplist)

    return {
        'assignment': assignment,
        'form': form,
        'votes': votes,
        'polls': polls,
    }


@permission_required('assignment.can_manage_assignment')
@template('assignment/edit.html')
def edit(request, assignment_id=None):
    """
    View zum editieren und neuanlegen von Wahlen
    """
    if assignment_id is not None:
        assignment = Assignment.objects.get(id=assignment_id)
    else:
        assignment = None

    if request.method == 'POST':
        form = AssignmentForm(request.POST, instance=assignment)
        if form.is_valid():
            assignment = form.save()
            if assignment_id is None:
                messages.success(request, _('New election was successfully created.'))
            else:
                messages.success(request, _('Election was successfully modified.'))
            if not 'apply' in request.POST:
                return redirect(reverse("assignment_overview"))
            if assignment_id is None:
                return redirect(reverse('assignment_edit', args=[assignment.id]))
        else:
            messages.error(request, _('Please check the form for errors.'))
    else:
        form = AssignmentForm(instance=assignment)
    if assignment:
        polls = assignment.poll_set.filter(assignment=assignment)
    else:
        polls = None
    return {
        'form': form,
        'assignment': assignment,
        'polls': polls,
    }


@permission_required('assignment.can_manage_assignment')
def delete(request, assignment_id):
    assignment = Assignment.objects.get(pk=assignment_id)
    if request.method == 'POST':
        assignment.delete()
        messages.success(request, _('Election <b>%s</b> was successfully deleted.') % assignment)
    else:
        del_confirm_form(request, assignment)
    return redirect(reverse('assignment_overview'))


@permission_required('assignment.can_manage_assignment')
@template('assignment/view.html')
def set_status(request, assignment_id=None, status=None):
    try:
        if status is not None:
            assignment = Assignment.objects.get(pk=assignment_id)
            assignment.set_status(status)
            messages.success(request, _('Election status was set to: <b>%s</b>.') % assignment.get_status_display())
    except Assignment.DoesNotExist:
        pass
    return redirect(reverse('assignment_view', args=[assignment_id]))


@permission_required('assignment.can_nominate_self')
def run(request, assignment_id):
    assignment = Assignment.objects.get(pk=assignment_id)
    try:
        assignment.run(request.user.profile)
        messages.success(request, _('You have set your candidature successfully.') )
    except NameError, e:
        messages.error(request, e)
    except Profile.DoesNotExist:
        messages.error(request,
                       _("You can't candidate. Your user account is only for administration."))
    return redirect(reverse('assignment_view', args=assignment_id))


@login_required
def delrun(request, assignment_id):
    assignment = Assignment.objects.get(pk=assignment_id)
    assignment.delrun(request.user.profile)
    messages.success(request, _("You have withdrawn your candidature successfully.") )
    return redirect(reverse('assignment_view', args=assignment_id))


@permission_required('assignment.can_manage_assignment')
def delother(request, assignment_id, profile_id):
    assignment = Assignment.objects.get(pk=assignment_id)
    profile = Profile.objects.get(pk=profile_id)

    if request.method == 'POST':
        assignment.delrun(profile)
        messages.success(request, _("Candidate <b>%s</b> was withdrawn successfully.") % (profile))
    else:
        gen_confirm_form(request,
                       _("Do you really want to withdraw <b>%s</b> from the election?") \
                        % profile, reverse('assignment_delother', args=[assignment_id, profile_id]))
    return redirect(reverse('assignment_view', args=assignment_id))


@permission_required('assignment.can_manage_assignment')
def set_active(request, assignment_id):
    assignment = Assignment.objects.get(pk=assignment_id)
    assignment.set_active()
    return redirect(reverse('assignment_view', args=[assignment_id]))


@permission_required('assignment.can_manage_assignment')
def gen_poll(request, assignment_id):
    poll = Assignment.objects.get(pk=assignment_id).gen_poll()
    messages.success(request, _("New ballot was successfully created.") )
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
        if not 'apply' in self.request.POST:
            return reverse('assignment_view', args=[self.poll.assignment.id])
        return ''


@permission_required('assignment.can_manage_assignment')
def set_publish_status(request, poll_id):
    try:
        poll = AssignmentPoll.objects.get(pk=poll_id)
        if poll.published:
            poll.set_published(False)
        else:
            poll.set_published(True)
    except AssignmentPoll.DoesNotExist:
        messages.error(request, _('Ballot ID %d does not exist.') % int(poll_id))
        return redirect(reverse('assignment_view', args=[poll.assignment.id]))

    if request.is_ajax():
        return ajax_request({'published': poll.published})

    if poll.published:
        messages.success(request, _("Ballot successfully published.") )
    else:
        messages.success(request, _("Ballot successfully unpublished.") )
    return redirect(reverse('assignment_view', args=[poll.assignment.id]))


@permission_required('assignment.can_manage_assignment')
def set_elected(request, assignment_id, profile_id, elected=True):
    assignment = Assignment.objects.get(pk=assignment_id)
    profile = Profile.objects.get(pk=profile_id)
    assignment.set_elected(profile, elected)

    if request.is_ajax():
        if elected:
            link = reverse('assignment_user_not_elected', args=[assignment.id, profile.id])
            text = _('not elected')
        else:
            link = reverse('assignment_user_elected', args=[assignment.id, profile.id])
            text = _('elected')
        return ajax_request({'elected': elected,
                             'link': link,
                             'text': text})

    return redirect(reverse('assignment_view', args=[assignment_id]))


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


class AssignmentPDF(PDFView):
    permission_required = 'assignment.can_see_assignment'
    top_space = 0

    def get_filename(self):
        try:
            assignment_id = self.kwargs['assignment_id']
            assignment = Assignment.objects.get(id=assignment_id)
            filename = u'%s-%s' % (_("Assignment"), assignment.name.replace(' ','_'))
        except:
            filename = _("Elections")
        return filename

    def append_to_pdf(self, story):
        try:
            assignment_id = self.kwargs['assignment_id']
        except KeyError:
            assignment_id = None
        if assignment_id is None:  #print all assignments
            title = config["assignment_pdf_title"]
            story.append(Paragraph(title, stylesheet['Heading1']))
            preamble = config["assignment_pdf_preamble"]
            if preamble:
                story.append(Paragraph("%s" % preamble.replace('\r\n','<br/>'), stylesheet['Paragraph']))
            story.append(Spacer(0,0.75*cm))
            # List of assignments
            for assignment in Assignment.objects.order_by('name'):
                story.append(Paragraph(assignment.name, stylesheet['Heading3']))
            # Assignment details (each assignment on single page)
            for assignment in Assignment.objects.order_by('name'):
                story.append(PageBreak())
                story = self.get_assignment(assignment, story)
        else:  # print selected assignment
            assignment = Assignment.objects.get(id=assignment_id)
            story = self.get_assignment(assignment, story)

    def get_assignment(self, assignment, story):
        # title
        story.append(Paragraph(_("Election")+": %s" % assignment.name, stylesheet['Heading1']))
        story.append(Spacer(0,0.5*cm))
        # posts
        cell1a = []
        cell1a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Number of available posts"), stylesheet['Bold']))
        cell1b = []
        cell1b.append(Paragraph(str(assignment.posts), stylesheet['Paragraph']))
        # candidates
        cell2a = []
        cell2a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font><seqreset id='counter'>" % _("Candidates"), stylesheet['Heading4']))
        cell2b = []
        for c in assignment.profile.all():
            cell2b.append(Paragraph("<seq id='counter'/>.&nbsp; %s" % unicode(c), stylesheet['Signaturefield']))
        if assignment.status == "sea":
            for x in range(0,2*assignment.posts):
                cell2b.append(Paragraph("<seq id='counter'/>.&nbsp; __________________________________________",stylesheet['Signaturefield']))
        cell2b.append(Spacer(0,0.2*cm))
        # vote results
        table_votes = []
        results = self.get_assignment_votes(assignment)
        cell3a = []
        cell3a.append(Paragraph("%s:" % (_("Vote results")), stylesheet['Heading4']))
        if len(results) > 0:
            if len(results[0]) >= 1:
                cell3a.append(Paragraph("%s %s" % (len(results[0][1]), _("ballots")), stylesheet['Normal']))
            if len(results[0][1]) > 0:
                data_votes = []
                # add table head row
                headrow = []
                headrow.append(_("Candidates"))
                for i in range (0,len(results[0][1])):
                    headrow.append("%s." %(str(i+1)))
                data_votes.append(headrow)
                # add result rows
                for candidate in results:
                    row = []
                    if candidate[0][1]:
                        elected = "* "
                    else:
                        elected = ""
                    c = str(candidate[0][0]).split("(",1)
                    if len(c) > 1:
                        row.append(elected+c[0]+"\n"+"("+c[1])
                    else:
                        row.append(elected+str(candidate[0][0]))
                    for votes in candidate[1]:
                        if type(votes) == type(list()):
                            tmp = _("Y")+": "+str(votes[0])+"\n"
                            tmp += _("N")+": "+str(votes[1])+"\n"
                            tmp += _("A")+": "+str(votes[2])
                            row.append(tmp)
                        else:
                            row.append(str(votes))

                    data_votes.append(row)
                polls = []
                for poll in assignment.poll_set.filter(assignment=assignment):
                    polls.append(poll)
                # votes invalid
                row = []
                row.append(_("Invalid votes"))
                for p in polls:
                    if p.published:
                        row.append(p.print_votesinvalid())
                data_votes.append(row)

                # votes cast
                row = []
                row.append(_("Votes cast"))
                for p in polls:
                    if p.published:
                        row.append(p.print_votescast())
                data_votes.append(row)

                table_votes=Table(data_votes)
                table_votes.setStyle( TableStyle([
                                ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
                                ('VALIGN',(0,0),(-1,-1), 'TOP'),
                                ('LINEABOVE',(0,0),(-1,0),2,colors.black),
                                ('LINEABOVE',(0,1),(-1,1),1,colors.black),
                                ('LINEBELOW',(0,-1),(-1,-1),2,colors.black),
                                ('ROWBACKGROUNDS', (0, 1), (-1, -1), (colors.white, (.9, .9, .9))),
                                  ]))

        # table
        data = []
        data.append([cell1a,cell1b])
        if table_votes:
            data.append([cell3a,table_votes])
            data.append(['','* = '+_('elected')])
        else:
            data.append([cell2a,cell2b])
        data.append([Spacer(0,0.2*cm),''])
        t=Table(data)
        t._argW[0]=4.5*cm
        t._argW[1]=11*cm
        t.setStyle(TableStyle([ ('BOX', (0,0), (-1,-1), 1, colors.black),
                                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                              ]))
        story.append(t)
        story.append(Spacer(0,1*cm))
        # text
        story.append(Paragraph("%s" % assignment.description.replace('\r\n','<br/>'), stylesheet['Paragraph']))
        return story

    def get_assignment_votes(self, assignment):
        votes = []
        for candidate in assignment.candidates:
            tmplist = ((candidate, assignment.is_elected(candidate)), [])
            for poll in assignment.poll_set.all():
                if poll.published:
                    if poll.get_options().filter(candidate=candidate).exists():
                        option = AssignmentOption.objects.filter(poll=poll).get(candidate=candidate)
                        try:
                            tmplist[1].append(option.get_votes()[0])
                        except IndexError:
                            tmplist[1].append('–')
                    else:
                        tmplist[1].append("-")
            votes.append(tmplist)
        return votes


class AssignmentPollPDF(PDFView):
    permission_required = 'assignment.can_manage_assignment'
    top_space = 0

    def get(self, request, *args, **kwargs):
        self.poll = AssignmentPoll.objects.get(id=self.kwargs['poll_id'])
        return super(AssignmentPollPDF, self).get(request, *args, **kwargs)

    def get_filename(self):
        filename = u'%s-%s-#%s' % (_("Election"), self.poll.assignment.name.replace(' ','_'), 1)#self.poll.get_ballot())
        return filename

    def get_template(self, buffer):
        return SimpleDocTemplate(buffer, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0, showBoundary=False)

    def build_document(self, pdf_document, story):
        pdf_document.build(story)

    def append_to_pdf(self, story):
        imgpath = os.path.join(SITE_ROOT, 'static/images/circle.png')
        circle = "<img src='%s' width='15' height='15'/>&nbsp;&nbsp;" % imgpath
        cell = []
        cell.append(Spacer(0,0.8*cm))
        cell.append(Paragraph(_("Election") + ": " + self.poll.assignment.name, stylesheet['Ballot_title']))
        cell.append(Paragraph(self.poll.assignment.polldescription, stylesheet['Ballot_subtitle']))
        options = self.poll.get_options().order_by('candidate')
        cell.append(Paragraph(str(self.poll.get_ballot())+". "+_("ballot")+", "+str(len(options))+" "+ ungettext("candidate", "candidates", len(options))+", "+str(self.poll.assignment.posts)+" "+_("available posts"), stylesheet['Ballot_description']))
        cell.append(Spacer(0,0.4*cm))

        data= []
        # get ballot papers config values
        number = 1
        ballot_papers_selection = config["assignment_pdf_ballot_papers_selection"]
        ballot_papers_number = config["assignment_pdf_ballot_papers_number"]
        # TODO: 'optiondecision'
        #if self.poll.optiondecision:
        #    for option in options:
        #        o = str(option).split("(",1)
        #        cell.append(Paragraph(o[0], stylesheet['Ballot_option_name']))
        #        if len(o) > 1:
        #            cell.append(Paragraph("("+o[1], stylesheet['Ballot_option_group']))
        #        else:
        #            cell.append(Paragraph("&nbsp;", stylesheet['Ballot_option_group']))
        #        cell.append(Paragraph(circle+_("Yes")+"&nbsp; &nbsp; &nbsp; "+circle+_("No")+"&nbsp; &nbsp; &nbsp; "+circle+_("Abstention"), stylesheet['Ballot_option_YNA']))
        #    # set number of ballot papers
        #    if ballot_papers_selection == "1":
        #        number = User.objects.filter(profile__type__iexact="delegate").count()
        #    if ballot_papers_selection == "2":
        #        number = int(User.objects.count() - 1)
        #    if ballot_papers_selection == "0":
        #        number = int(ballot_papers_number)
        #    # print ballot papers
        #    for user in xrange(number/2):
        #        data.append([cell,cell])
        #    rest = number % 2
        #    if rest:
        #        data.append([cell,''])

        #    if len(options) <= 2:
        #        t=Table(data, 10.5*cm, 7.42*cm)
        #    elif len(options) <= 5:
        #        t=Table(data, 10.5*cm, 14.84*cm)
        #    else:
        #        t=Table(data, 10.5*cm, 29.7*cm)
        #else:
        for option in options:
            o = str(option).split("(",1)
            cell.append(Paragraph(circle+o[0], stylesheet['Ballot_option_name']))
            if len(o) > 1:
                cell.append(Paragraph("("+o[1], stylesheet['Ballot_option_group_right']))
            else:
                cell.append(Paragraph("&nbsp;", stylesheet['Ballot_option_group_right']))
        # set number of ballot papers
        if ballot_papers_selection == "1":
            number = User.objects.filter(profile__type__iexact="delegate").count()
        if ballot_papers_selection == "2":
            number = int(User.objects.count() - 1)
        if ballot_papers_selection == "0":
            number = int(ballot_papers_number)
        if number == 0:
            number = 1
        # print ballot papers
        if number > 0:
            for user in xrange(number/2):
                data.append([cell,cell])
            rest = number % 2
            if rest:
                data.append([cell,''])

        if len(options) <= 4:
            t=Table(data, 10.5*cm, 7.42*cm)
        elif len(options) <= 8:
            t=Table(data, 10.5*cm, 14.84*cm)
        else:
            t=Table(data, 10.5*cm, 29.7*cm)

        t.setStyle(TableStyle([ ('GRID', (0,0), (-1,-1), 0.25, colors.grey),
                                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                              ]))
        story.append(t)


class Config(FormView):
    permission_required = 'config.can_manage_config'
    form_class = ConfigForm
    template_name = 'assignment/config.html'

    def get_initial(self):
        return {
            'assignment_publish_winner_results_only': config['assignment_publish_winner_results_only'],
            'assignment_pdf_ballot_papers_selection': config['assignment_pdf_ballot_papers_selection'],
            'assignment_pdf_ballot_papers_number': config['assignment_pdf_ballot_papers_number'],
            'assignment_pdf_title': config['assignment_pdf_title'],
            'assignment_pdf_preamble': config['assignment_pdf_preamble'],
        }

    def form_valid(self, form):
        if form.cleaned_data['assignment_publish_winner_results_only']:
            config['assignment_publish_winner_results_only'] = True
        else:
            config['assignment_publish_winner_results_only'] = False
        config['assignment_pdf_ballot_papers_selection'] = form.cleaned_data['assignment_pdf_ballot_papers_selection']
        config['assignment_pdf_ballot_papers_number'] = form.cleaned_data['assignment_pdf_ballot_papers_number']
        config['assignment_pdf_title'] = form.cleaned_data['assignment_pdf_title']
        config['assignment_pdf_preamble'] = form.cleaned_data['assignment_pdf_preamble']
        messages.success(self.request, _('Election settings successfully saved.'))
        return super(Config, self).form_valid(form)


def register_tab(request):
    selected = True if request.path.startswith('/assignment/') else False
    return Tab(
        title=_('Elections'),
        url=reverse('assignment_overview'),
        permission=request.user.has_perm('assignment.can_see_assignment') or request.user.has_perm('assignment.can_nominate_other') or request.user.has_perm('assignment.can_nominate_self') or request.user.has_perm('assignment.can_manage_assignment'),
        selected=selected,
    )


def get_widgets(request):
    return [get_model_widget(name='assignments', model=Assignment)]
