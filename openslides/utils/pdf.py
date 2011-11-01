#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.pdf
    ~~~~~~~~~~~~~~~~~~~~

    Print PDF functions for all OpenSlides apps.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from datetime import datetime
import os

from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.utils.translation import ugettext as _
from django.utils.translation import ungettext
from django.contrib.auth.models import User

from reportlab.pdfgen.canvas import Canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle as PS
from reportlab.lib.styles import StyleSheet1, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Frame, PageBreak, Spacer, Table, LongTable, TableStyle, Image
from reportlab.platypus.doctemplate import SimpleDocTemplate
from reportlab.rl_config import defaultPageSize
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from openslides.agenda.models import Item
from openslides.agenda.api import children_list
from openslides.application.models import Application
from openslides.assignment.models import Assignment
from openslides.poll.models import Poll, Option
from openslides.participant.models import Profile
from openslides.system.api import config_get
from openslides.settings import SITE_ROOT
from openslides.utils.utils import permission_required


# register new truetype fonts
pdfmetrics.registerFont(TTFont('Ubuntu', os.path.join(SITE_ROOT, 'static/fonts/Ubuntu-R.ttf')))
pdfmetrics.registerFont(TTFont('Ubuntu-Bold', os.path.join(SITE_ROOT, 'static/fonts/Ubuntu-B.ttf')))
pdfmetrics.registerFont(TTFont('Ubuntu-Italic', os.path.join(SITE_ROOT, 'static/fonts/Ubuntu-RI.ttf')))


# set style information
PAGE_HEIGHT=defaultPageSize[1];
PAGE_WIDTH=defaultPageSize[0]


# set custom stylesheets
stylesheet = StyleSheet1()
stylesheet.add(ParagraphStyle(name = 'Normal',
                              fontName = 'Ubuntu',
                              fontSize = 10,
                              leading = 12)
               )
stylesheet.add(ParagraphStyle(name = 'Paragraph',
                              parent = stylesheet['Normal'],
                              leading = 14,
                              spaceAfter = 15)
               )
stylesheet.add(ParagraphStyle(name = 'Small',
                              parent = stylesheet['Normal'],
                              fontSize = 8)
               )
stylesheet.add(ParagraphStyle(name = 'Italic',
                              parent = stylesheet['Normal'],
                              fontName = 'Ubuntu-Italic',
                              spaceAfter = 5)
               )
stylesheet.add(ParagraphStyle(name = 'Bold',
                              parent = stylesheet['Normal'],
                              fontName = 'Ubuntu-Bold')
               )
stylesheet.add(ParagraphStyle(name = 'Heading1',
                              parent = stylesheet['Bold'],
                              fontSize = 24,
                              leading = 30,
                              spaceAfter = 6),
               alias = 'h1')
stylesheet.add(ParagraphStyle(name = 'Heading2',
                              parent = stylesheet['Bold'],
                              fontSize = 14,
                              leading = 24,
                              spaceAfter = 10),
               alias = 'h2')
stylesheet.add(ParagraphStyle(name = 'Heading3',
                              parent = stylesheet['Bold'],
                              fontSize = 12,
                              leading = 20),
               alias = 'h3')
stylesheet.add(ParagraphStyle(name = 'Heading4',
                              parent = stylesheet['Bold'],
                              fontSize = 10,
                              leading = 20),
               )
stylesheet.add(ParagraphStyle(name = 'Item',
                              parent = stylesheet['Normal'],
                              fontSize = 14,
                              leading = 14,
                              leftIndent = 0,
                              spaceAfter = 15)
               )
stylesheet.add(ParagraphStyle(name = 'Subitem',
                              parent = stylesheet['Normal'],
                              fontSize = 10,
                              leading = 10,
                              leftIndent = 20,
                              spaceAfter = 15)
               )
stylesheet.add(ParagraphStyle(name = 'Tablecell',
                              parent = stylesheet['Normal'],
                              fontSize = 9)
               )
stylesheet.add(ParagraphStyle(name = 'Signaturefield',
                              parent = stylesheet['Normal'],
                              spaceBefore = 15)
               )

# Ballot stylesheets
stylesheet.add(ParagraphStyle(name = 'Ballot_title',
                              parent = stylesheet['Bold'],
                              fontSize = 12,
                              leading = 14,
                              leftIndent = 30),
               )
stylesheet.add(ParagraphStyle(name = 'Ballot_subtitle',
                              parent = stylesheet['Normal'],
                              fontSize = 10,
                              leading = 12,
                              leftIndent = 30,
                              rightIndent = 20,
                              spaceAfter = 5),
               )
stylesheet.add(ParagraphStyle(name = 'Ballot_description',
                              parent = stylesheet['Normal'],
                              fontSize = 7,
                              leading = 10,
                              leftIndent = 30),
               )
stylesheet.add(ParagraphStyle(name = 'Ballot_option',
                              parent = stylesheet['Normal'],
                              fontSize = 12,
                              leading = 24,
                              leftIndent = 30),
               )
stylesheet.add(ParagraphStyle(name = 'Ballot_option_name',
                              parent = stylesheet['Normal'],
                              fontSize = 12,
                              leading = 15,
                              leftIndent = 30),
               )
stylesheet.add(ParagraphStyle(name = 'Ballot_option_group',
                              parent = stylesheet['Normal'],
                              fontSize = 8,
                              leading = 15,
                              leftIndent = 30),
               )
stylesheet.add(ParagraphStyle(name = 'Ballot_option_YNA',
                              parent = stylesheet['Normal'],
                              fontSize = 12,
                              leading = 15,
                              leftIndent = 49,
                              spaceAfter = 18),
               )
stylesheet.add(ParagraphStyle(name = 'Ballot_option_group_right',
                              parent = stylesheet['Normal'],
                              fontSize = 8,
                              leading = 16,
                              leftIndent = 49),
               )

# set event information
event_name = config_get("event_name")
event_description = config_get("event_description")
event_date = config_get("event_date")
event_location = config_get("event_location")
event_organizer = config_get("event_organizer")

# set print time
time = datetime.now().strftime(str(_("%Y-%m-%d %H:%Mh")))


def firstPage(canvas, doc):
    canvas.saveState()
    # page header (with event information)
    canvas.setFont('Ubuntu',10)
    canvas.setFillGray(0.4)
    canvas.drawString(2.75*cm, 28*cm, "%s | %s" % (event_name, event_description))
    if event_date and event_location:
        canvas.drawString(2.75*cm, 27.6*cm, "%s, %s" % (event_date, event_location))
    # time
    canvas.setFont('Ubuntu',7)
    canvas.drawString(15*cm, 28*cm, _("Printed")+": %s" % time)
    # title
    if doc.title:
        canvas.setFont('Ubuntu-Bold',24)
        canvas.setFillGray(0)
        #canvas.drawCentredString(PAGE_WIDTH/2.0, PAGE_HEIGHT-108, doc.title)
        canvas.drawString(2.75*cm, PAGE_HEIGHT-108, doc.title)
    # footer (with page number)
    canvas.setFont('Ubuntu',8)
    canvas.setFillGray(0.4)
    canvas.drawString(10*cm, 1*cm, _("Page")+" %s" % doc.page)
    canvas.restoreState()


def laterPages(canvas, doc):
    canvas.saveState()
    # footer (with page number)
    canvas.setFont('Ubuntu',7)
    canvas.setFillGray(0.4)
    canvas.drawString(10*cm, 1*cm, _("Page")+" %s" % doc.page)
    canvas.restoreState()


@permission_required('agenda.can_see_agenda')
def print_agenda(request):
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s.pdf;' % _("Agenda")
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response)
    story = [Spacer(1,3*cm)]

    doc.title = _("Agenda")
    # print item list
    items = children_list(Item.objects.filter(parent=None).order_by('weight'))
    for item in items:
        if item.hidden is False:
            # print all items"
            if item.parents:
                space = ""
                counter = 0
                for p in item.parents:
                    if counter != 0:
                        space += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
                    counter += 1
                story.append(Paragraph(space+item.title, stylesheet['Subitem']))
            else:
                story.append(Paragraph(item.title, stylesheet['Item']))

    doc.build(story, onFirstPage=firstPage, onLaterPages=laterPages)
    return response


@permission_required('participant.can_see_participant')
def print_userlist(request):
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s.pdf;' % _("Participant-list")
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response)
    story = [Spacer(1,2*cm)]

    doc.title = _("List of Participants")
    # Table
    data= [['#', _('Last Name'), _('First Name'), _('Group'), _('Type'), _('Committee')]]
    sort = 'last_name'
    counter = 0
    for user in User.objects.all().order_by(sort):
        try:
            counter += 1
            user.get_profile()
            data.append([counter,
                    Paragraph(user.last_name, stylesheet['Tablecell']),
                    Paragraph(user.first_name, stylesheet['Tablecell']),
                    Paragraph(user.profile.group, stylesheet['Tablecell']),
                    Paragraph(user.profile.get_type_display(), stylesheet['Tablecell']),
                    Paragraph(user.profile.committee, stylesheet['Tablecell']),
                    ])
        except Profile.DoesNotExist:
            counter -= 1
            pass

    t=LongTable(data,
                    style=[
                        ('VALIGN',(0,0),(-1,-1), 'TOP'),
                        ('LINEABOVE',(0,0),(-1,0),2,colors.black),
                        ('LINEABOVE',(0,1),(-1,1),1,colors.black),
                        ('LINEBELOW',(0,-1),(-1,-1),2,colors.black),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), (colors.white, (.9, .9, .9))),
                        ])
    t._argW[0]=0.75*cm
    story.append(t)
    doc.build(story, onFirstPage=firstPage, onLaterPages=laterPages)
    return response


@permission_required('participant.can_manage_participant')
def print_passwords(request):
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s.pdf;' % _("passwords")
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response, pagesize=A4, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0, showBoundary=False)
    story = [Spacer(0,0*cm)]

    data= []
    system_url = config_get("system_url")
    system_welcometext = config_get("system_welcometext")
    for user in User.objects.all().order_by('last_name'):
        try:
            user.get_profile()
            cell = []
            cell.append(Spacer(0,0.8*cm))
            cell.append(Paragraph(_("Your Account for OpenSlides"), stylesheet['Ballot_title']))
            cell.append(Paragraph(_("for %s") % (user.profile), stylesheet['Ballot_subtitle']))
            cell.append(Spacer(0,0.5*cm))
            cell.append(Paragraph(_("User: %s") % (user.username), stylesheet['Ballot_option']))
            cell.append(Paragraph(_("Password: %s") % (user.profile.firstpassword), stylesheet['Ballot_option']))
            cell.append(Spacer(0,0.5*cm))
            cell.append(Paragraph(_("URL: %s") % (system_url), stylesheet['Ballot_option']))
            cell.append(Spacer(0,0.5*cm))
            cell2 = []
            cell2.append(Spacer(0,0.8*cm))
            if system_welcometext is not None:
                cell2.append(Paragraph(system_welcometext.replace('\r\n','<br/>'), stylesheet['Ballot_subtitle']))

            data.append([cell,cell2])
        except Profile.DoesNotExist:
            pass

    t=Table(data, 10.5*cm, 7.42*cm)
    t.setStyle(TableStyle([ ('LINEBELOW', (0,0), (-1,0), 0.25, colors.grey),
                            ('LINEBELOW', (0,1), (-1,1), 0.25, colors.grey),
                            ('LINEBELOW', (0,1), (-1,-1), 0.25, colors.grey),
                            ('VALIGN', (0,0), (-1,-1), 'TOP'),
                          ]))
    story.append(t)
    doc.build(story)
    return response


def get_application(application, story):
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
    
    # voting results
    if len(application.results) > 0:
        cell4a = []
        cell4a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Vote results"), stylesheet['Heading4']))
        cell4b = []
        ballotcounter = 0
        for result in application.results:
            ballotcounter += 1
            if len(application.results) > 1:
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


@permission_required('application.can_see_application')
def print_application(request, application_id=None):
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s.pdf;' % _("Applications")
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response)
    doc.title = None
    story = []
    
    if application_id is None:  #print all applications
        title = config_get("application_pdf_title")
        story.append(Paragraph(title, stylesheet['Heading1']))
        preamble = config_get("application_pdf_preamble")
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
            story = get_application(application, story)
    else:  # print selected application
        application = Application.objects.get(id=application_id)
        if application.number:
            number = application.number
        else:
            number = ""
        filename = u'filename=%s%s.pdf;' % (_("Application"), str(number))
        response['Content-Disposition'] = filename.encode('utf-8')
        story = get_application(application, story)

    doc.build(story, onFirstPage=firstPage, onLaterPages=firstPage)
    return response


@permission_required('application.can_manage_application')
def print_application_poll(request, poll_id=None):
    poll = Poll.objects.get(id=poll_id)
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s%s_%s.pdf;' % (_("Application"), str(poll.application.number), _("Poll"))
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response, pagesize=A4, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0, showBoundary=False)
    story = [Spacer(0,0*cm)]

    imgpath = os.path.join(SITE_ROOT, 'static/images/circle.png')
    circle = "<img src='%s' width='15' height='15'/>&nbsp;&nbsp;" % imgpath
    cell = []
    cell.append(Spacer(0,0.8*cm))
    cell.append(Paragraph(_("Application No.")+" "+str(poll.application.number), stylesheet['Ballot_title']))
    cell.append(Paragraph(poll.application.title, stylesheet['Ballot_subtitle']))
    cell.append(Paragraph(str(poll.ballot)+". "+_("Vote"), stylesheet['Ballot_description']))
    cell.append(Spacer(0,0.5*cm))
    cell.append(Paragraph(circle+_("Yes"), stylesheet['Ballot_option']))
    cell.append(Paragraph(circle+_("No"), stylesheet['Ballot_option']))
    cell.append(Paragraph(circle+_("Abstention"), stylesheet['Ballot_option']))

    data= []
    number = 1
    # get ballot papers config values
    ballot_papers_selection = config_get("application_pdf_ballot_papers_selection")
    ballot_papers_number = config_get("application_pdf_ballot_papers_number")
    # set number of ballot papers
    if ballot_papers_selection == "1":
        number = User.objects.filter(profile__type__iexact="delegate").count()
    if ballot_papers_selection == "2":
        number = int(User.objects.count() - 1)
    if ballot_papers_selection == "0":
        number = int(ballot_papers_number)
    # print ballot papers
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
    doc.build(story)
    return response

def get_assignment_votes(assignment):
    votes = []
    for candidate in assignment.candidates:
        tmplist = [[candidate, assignment.is_elected(candidate)], []]
        for poll in assignment.poll_set.all():
            if poll.published:
                if candidate in poll.options_values:
                    option = Option.objects.filter(poll=poll).filter(user=candidate)[0]
                    if poll.optiondecision:
                        tmplist[1].append([option.yes, option.no, option.undesided])
                    else:
                        tmplist[1].append(option.yes)
                else:
                    tmplist[1].append("-")
            elif len(tmplist[1]) == 0:
                return votes
        votes.append(tmplist)
    return votes

def get_assignment(assignment, story):
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
    results = get_assignment_votes(assignment)
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
                    row.append(p.votesinvalidf)
            data_votes.append(row)

            # votes cast
            row = []
            row.append(_("Votes cast"))
            for p in polls:
                if p.published:
                    row.append(p.votescastf)
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
    
@permission_required('application.can_see_application')
def print_assignment(request, assignment_id=None):
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s.pdf;' % _("Elections")
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response)
    doc.title = None
    story = []
    
    if assignment_id is None:  #print all applications
        title = config_get("assignment_pdf_title")
        story.append(Paragraph(title, stylesheet['Heading1']))
        preamble = config_get("assignment_pdf_preamble")
        if preamble:
            story.append(Paragraph("%s" % preamble.replace('\r\n','<br/>'), stylesheet['Paragraph']))
        story.append(Spacer(0,0.75*cm))
        # List of assignments
        for assignment in Assignment.objects.order_by('name'):
            story.append(Paragraph(assignment.name, stylesheet['Heading3']))
        # Assignment details (each assignment on single page)
        for assignment in Assignment.objects.order_by('name'):
            story.append(PageBreak())
            story = get_assignment(assignment, story)
    else:  # print selected assignment
        assignment = Assignment.objects.get(id=assignment_id)
        filename = u'filename=%s-%s.pdf;' % (_("Assignment"), assignment.name.replace(' ','_'))
        response['Content-Disposition'] = filename.encode('utf-8')
        story = get_assignment(assignment, story)

    doc.build(story, onFirstPage=firstPage, onLaterPages=firstPage)
    return response
    
@permission_required('application.can_manage_application')
def print_assignment_poll(request, poll_id=None):
    poll = Poll.objects.get(id=poll_id)
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s-%s-#%s.pdf;' % (_("Election"), poll.assignment.name.replace(' ','_'), poll.ballot)
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response, pagesize=A4, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0, showBoundary=False)
    story = [Spacer(0,0*cm)]

    imgpath = os.path.join(SITE_ROOT, 'static/images/circle.png')
    circle = "<img src='%s' width='15' height='15'/>&nbsp;&nbsp;" % imgpath
    cell = []
    cell.append(Spacer(0,0.8*cm))
    cell.append(Paragraph(_("Election") + ": " + poll.assignment.name, stylesheet['Ballot_title']))
    cell.append(Paragraph(poll.description, stylesheet['Ballot_subtitle']))
    options = poll.get_options().order_by('user__user__first_name')
    cell.append(Paragraph(str(poll.ballot)+". "+_("ballot")+", "+str(len(options))+" "+ ungettext("candidate", "candidates", len(options))+", "+str(poll.assignment.posts)+" "+_("available posts"), stylesheet['Ballot_description']))
    cell.append(Spacer(0,0.4*cm))

    data= []
    # get ballot papers config values
    number = 1
    ballot_papers_selection = config_get("assignment_pdf_ballot_papers_selection")
    ballot_papers_number = config_get("assignment_pdf_ballot_papers_number")
    if poll.optiondecision:
        for option in options:
            o = str(option).split("(",1)
            cell.append(Paragraph(o[0], stylesheet['Ballot_option_name']))
            if len(o) > 1:
                cell.append(Paragraph("("+o[1], stylesheet['Ballot_option_group']))
            else:
                cell.append(Paragraph("&nbsp;", stylesheet['Ballot_option_group']))
            cell.append(Paragraph(circle+_("Yes")+"&nbsp; &nbsp; &nbsp; "+circle+_("No")+"&nbsp; &nbsp; &nbsp; "+circle+_("Abstention"), stylesheet['Ballot_option_YNA']))
        # set number of ballot papers
        if ballot_papers_selection == "1":
            number = User.objects.filter(profile__type__iexact="delegate").count()
        if ballot_papers_selection == "2":
            number = int(User.objects.count() - 1)
        if ballot_papers_selection == "0":
            number = int(ballot_papers_number)
        # print ballot papers
        for user in xrange(number/2):
            data.append([cell,cell])
        rest = number % 2
        if rest:
            data.append([cell,''])
        
        if len(options) <= 2:
            t=Table(data, 10.5*cm, 7.42*cm)
        elif len(options) <= 5:
            t=Table(data, 10.5*cm, 14.84*cm)
        else:
            t=Table(data, 10.5*cm, 29.7*cm)
    else:
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
        # print ballot papers
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
    doc.build(story)
    return response
