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
from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.utils.translation import ugettext as _
from django.utils.translation import ungettext
from django.contrib.auth.models import User

from reportlab.pdfgen.canvas import Canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, inch
from reportlab.lib.styles import ParagraphStyle as PS
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Frame, PageBreak, Spacer, Table, LongTable, TableStyle, Image
from reportlab.platypus.doctemplate import SimpleDocTemplate
from reportlab.rl_config import defaultPageSize
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from openslides.agenda.models import Item
from openslides.application.models import Application
from openslides.agenda.api import children_list
from openslides.poll.models import Poll
from openslides.participant.models import Profile
from openslides.system.api import config_get

# register new truetype fonts
pdfmetrics.registerFont(TTFont('Ubuntu', 'openslides/static/fonts/Ubuntu-R.ttf'))
pdfmetrics.registerFont(TTFont('Ubuntu-Bold', 'openslides/static/fonts/Ubuntu-B.ttf'))
pdfmetrics.registerFont(TTFont('Ubuntu-Italic', 'openslides/static/fonts/Ubuntu-RI.ttf'))

# set style information
styles = getSampleStyleSheet()
PAGE_HEIGHT=defaultPageSize[1];
PAGE_WIDTH=defaultPageSize[0]

h2 = PS(name = 'h2',
        fontName = 'Ubuntu-Bold',
        fontSize = 14,
        leading = 24,
        leftIndent = 0,
        spaceAfter = 10)
h3 = PS(name = 'h3',
        fontName = 'Ubuntu-Bold',
        fontSize = 12,
        leading = 24,
        leftIndent = 0,
        spaceAfter = 0)
h3_poll = PS(name = 'h3_poll',
        fontName = 'Ubuntu-Bold',
        fontSize = 12,
        leading = 14,
        leftIndent = 30,
        spaceAfter = 0)
p = PS(name = 'Normal',
        fontName = 'Ubuntu',
        fontSize = 10,
        leading = 14,
        leftIndent = 0,
        spaceAfter = 15)
i = PS(name = 'Italic',
        fontName = 'Ubuntu-Italic',
        fontSize = 10,
        leftIndent = 0,
        spaceAfter = 5)
i_poll = PS(name = 'i_poll',
        fontName = 'Ubuntu',
        fontSize = 10,
        leftIndent = 30,
        rightIndent = 20,
        spaceAfter = 0)
small = PS(name = 'small',
        fontName = 'Ubuntu',
        fontSize = 7,
        leading = 14,
        leftIndent = 0,
        spaceAfter = 0)
small_poll = PS(name = 'small',
        fontName = 'Ubuntu',
        fontSize = 7,
        leading = 14,
        leftIndent = 30,
        spaceAfter = 0)
itemstyle = PS(name = 'Normal',
        fontName = 'Ubuntu',
        fontSize = 14,
        leading = 12,
        leftIndent = 0,
        spaceAfter = 15)
subitemstyle = PS(name = 'Normal',
        fontName = 'Ubuntu',
        fontSize = 10,
        leading = 4,
        leftIndent = 20,
        spaceAfter = 15)
cellstyle = PS(name='Normal',
        fontName = 'Ubuntu',
        fontSize = 9)
polloption = PS(name = 'polloption',
        fontName = 'Ubuntu',
        fontSize = 12,
        leading = 24,
        leftIndent = 30,
        spaceAfter = 0)
polloptionname = PS(name = 'polloption',
        fontName = 'Ubuntu',
        fontSize = 12,
        leading = 15,
        leftIndent = 30,
        spaceAfter = 0)
polloptionnameRight = PS(name = 'polloption',
        fontName = 'Ubuntu',
        fontSize = 12,
        leading = 15,
        leftIndent = 49,
        spaceAfter = 18)
polloptiongroup = PS(name = 'polloptiongroup',
        fontName = 'Ubuntu',
        fontSize = 8,
        leading = 16,
        leftIndent = 49,
        spaceAfter = 0)
polloptiongroupLeft = PS(name = 'polloptiongroupleft',
        fontName = 'Ubuntu',
        fontSize = 8,
        leading = 15,
        leftIndent = 30,
        spaceAfter = 0)


# set event information
event_name = config_get("event_name")
event_description = config_get("event_description")
event_date = config_get("event_date")
event_location = config_get("event_location")
event_organizer = config_get("event_organizer")

# set print time
time = datetime.now().strftime(_("%Y-%m-%d %H:%Mh"))

def firstPage(canvas, doc):
    canvas.saveState()
    # page header (with event information)
    canvas.setFont('Ubuntu',10)
    canvas.setFillGray(0.4)
    canvas.drawString(2.75*cm, 28*cm, "%s | %s" % (event_name, event_description))
    if event_date != "" and event_location != "":
        canvas.drawString(2.75*cm, 27.6*cm, "%s, %s" % (event_date, event_location))
    # time
    canvas.setFont('Ubuntu',7)
    canvas.drawString(15*cm, 28*cm, _("Printed")+": %s" % time)
    # title
    canvas.setFont('Ubuntu-Bold',24)
    canvas.setFillGray(0)
    canvas.drawCentredString(PAGE_WIDTH/2.0, PAGE_HEIGHT-108, doc.title)
    canvas.setFont('Ubuntu',10)
    canvas.setFillGray(0.4)
    canvas.drawCentredString(PAGE_WIDTH/2.0, PAGE_HEIGHT-125, doc.subtitle)
    # footer (with page number)
    canvas.setFont('Ubuntu',8)
    canvas.setFillGray(0.4)
    canvas.drawString(10*cm, 1*cm, _("Page")+" 1")
    canvas.restoreState()

def laterPages(canvas, doc):
    canvas.saveState()
    # footer (with page number)
    canvas.setFont('Ubuntu',7)
    canvas.setFillGray(0.4)
    canvas.drawString(10*cm, 1*cm, _("Page")+" %s" % doc.page)
    canvas.restoreState()

def print_agenda(request, printAllItems=None):
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s.pdf;' % _("Agenda")
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response)
    story = [Spacer(1,3*cm)]

    doc.title = _("Agenda")
    if printAllItems:
        doc.subtitle = "("+_("full")+")"
    else:
        doc.subtitle = "("+_("abridged")+")"

    # print item list
    items = children_list(Item.objects.filter(parent=None).order_by('weight'))
    for item in items:
        if item.hidden is False:
            # print all items
            if printAllItems:
                if item.parents:
                    story.append(Paragraph(item.title, subitemstyle))
                else:
                    story.append(Paragraph(item.title, itemstyle))
            # print items without parents only
            else:
                if item.parent is None:
                    story.append(Paragraph(item.title, itemstyle))

    doc.build(story, onFirstPage=firstPage, onLaterPages=laterPages)
    return response

def print_userlist(request):
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s.pdf;' % _("Participant-list")
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response)
    story = [Spacer(1,2*cm)]

    doc.title = _("List of Participants")
    doc.subtitle = ""
    # Table
    data= [['#', _('Last Name'), _('First Name'), _('Group'), _('Type'), _('Committee')]]
    sort = 'last_name'
    counter = 0
    for user in User.objects.all().order_by(sort):
        try:
            counter += 1
            user.get_profile()
            data.append([counter,
                    Paragraph(user.last_name, cellstyle),
                    Paragraph(user.first_name, cellstyle),
                    Paragraph(user.profile.group, cellstyle),
                    Paragraph(user.profile.type, cellstyle),
                    Paragraph(user.profile.committee, cellstyle),
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

def print_application(request, application_id=None):
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s.pdf;' % _("Applications")
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response)
    story = [Spacer(1,2*cm)]

    if application_id is None:
        doc.title = _("Applications")
        doc.subtitle = ""

        for application in Application.objects.exclude(number=None).order_by('number'):
            story.append(Paragraph(_("Application")+" #%s: %s" % (application.number, application.title), h3))

        # Applications (each application on single page)
        for application in Application.objects.exclude(number=None).order_by('number'):
            story.append(PageBreak())
            story.append(Paragraph(_("Application")+" #%s: %s" % (application.number, application.title), h2))
            story.append(Paragraph("%s" % application.text.replace('\r\n','<br/>'), p))
            story.append(Paragraph(_("Reason")+":", h3))
            story.append(Paragraph("%s" % application.reason.replace('\r\n','<br/>'), p))
            story.append(Paragraph(_("Submitter")+": %s" % unicode(application.submitter), i))
            story.append(Paragraph(_("Created")+": %s" % application.time.strftime(_("%Y-%m-%d %H:%Mh")), i))
            supporters = ""
            for s in application.supporter.all():
                supporters += "%s, " % unicode(s)
            story.append(Paragraph(_("Supporter")+": %s" % supporters, i))
            note = ""
            for n in application.notes:
                note += "%s " % unicode(n)
            if note != "":
                story.append(Paragraph(_("Status")+": %s | %s" % (application.get_status_display(), note), i))
            else:
                story.append(Paragraph(_("Status")+": %s" % (application.get_status_display()), i))

    else: # print selected application
        application = Application.objects.get(id=application_id)
        filename = u'filename=%s%s.pdf;' % (_("Application"), str(application.number))
        response['Content-Disposition'] = filename.encode('utf-8')
        doc = SimpleDocTemplate(response)
        if application.number is None:
            doc.title = _("Application")+" #[-]"
        else:
            doc.title = _("Application")+" #%s" % application.number
        doc.subtitle = ""
        
        story.append(Paragraph(application.title, h2))
        story.append(Paragraph("%s" % application.text.replace('\r\n','<br/>'), p))
        story.append(Paragraph(_("Reason")+":", h3))
        story.append(Paragraph("%s" % application.reason.replace('\r\n','<br/>'), p))
        story.append(Paragraph(_("Submitter")+": %s" % unicode(application.submitter), i))
        story.append(Paragraph(_("Created")+": %s" % application.time.strftime(_("%Y-%m-%d %H:%Mh")), i))
        supporters = ""
        for s in application.supporter.all():
            supporters += "%s, " % unicode(s)
        story.append(Paragraph(_("Supporter")+": %s" % supporters, i))
        note = ""
        for n in application.notes:
            note += "%s " % unicode(n)
        if note != "":
            story.append(Paragraph(_("Status")+": %s | %s" % (application.get_status_display(), note), i))
        else:
            story.append(Paragraph(_("Status")+": %s" % (application.get_status_display()), i))
        
    doc.build(story, onFirstPage=firstPage, onLaterPages=laterPages)
    return response

def print_application_poll(request, poll_id=None):
    poll = Poll.objects.get(id=poll_id)
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s%s_%s.pdf;' % (_("Application"), str(poll.application.number), _("Poll"))
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response, pagesize=A4, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0, showBoundary=False)
    story = [Spacer(0,0*cm)]
    
    circle = "<img src='openslides/static/images/circle.png' width='15' height='15'/>&nbsp;&nbsp;"
    cell = []
    cell.append(Spacer(0,0.8*cm))
    cell.append(Paragraph(poll.title, h3_poll))
    cell.append(Paragraph(_("Title")+": "+poll.application.title, i_poll))
    if poll.description:
        cell.append(Paragraph(poll.description, small_poll))
    cell.append(Spacer(0,0.5*cm))
    cell.append(Paragraph(circle+_("Yes"), polloption))
    cell.append(Paragraph(circle+_("No"), polloption))
    cell.append(Paragraph(circle+_("Abstention"), polloption))

    data= []
    for user in xrange(User.objects.count()/2):
        data.append([cell,cell])
    t=Table(data, 10.5*cm, 7.42*cm)
    t.setStyle(TableStyle([ ('GRID', (0,0), (-1,-1), 0.25, colors.grey),
                            ('VALIGN', (0,0), (-1,-1), 'TOP'),
                          ]))
    story.append(t)
    doc.build(story)
    return response

def print_assignment_poll(request, poll_id=None, ballotnumber=1, posts=None):
    poll = Poll.objects.get(id=poll_id)
    response = HttpResponse(mimetype='application/pdf')
    filename = u'filename=%s-%s-#%s.pdf;' % (_("Election"), poll.title.replace(' ','_'), ballotnumber)
    response['Content-Disposition'] = filename.encode('utf-8')
    doc = SimpleDocTemplate(response, pagesize=A4, topMargin=-6, bottomMargin=-6, leftMargin=0, rightMargin=0, showBoundary=False)
    story = [Spacer(0,0*cm)]
    
    circle = "<img src='openslides/static/images/circle.png' width='15' height='15'/>&nbsp;"
    cell = []
    cell.append(Spacer(0,0.8*cm))
    cell.append(Paragraph(poll.title, h3_poll))
    cell.append(Paragraph(poll.description, i_poll))
    options = poll.get_options().order_by('user__user__first_name')
    cell.append(Paragraph(ballotnumber+". "+_("ballot")+", "+str(len(options))+" "+ ungettext("candidate", "candidates", len(options))+", "+posts+" "+_("available posts"), small_poll))
    cell.append(Spacer(0,0.4*cm))
    
    if len(options) <= int(posts):
        optiondecision = True
    else:
        optiondecision = False
    
    if optiondecision:
        for option in options:
            o = str(option).rsplit("(",1)
            cell.append(Paragraph(o[0], polloptionname))
            if len(o) > 1:
                cell.append(Paragraph("("+o[1], polloptiongroupLeft))
            else:
                cell.append(Paragraph("&nbsp;", polloptiongroupLeft))
            cell.append(Paragraph(circle+_("Yes")+"&nbsp; &nbsp; &nbsp; "+circle+_("No")+"&nbsp; &nbsp; &nbsp; "+circle+_("Abstention"), polloptionnameRight))
        data= []
        for user in xrange(User.objects.count()/2):
            data.append([cell,cell])
        if len(options) <= 2:
            t=Table(data, 10.5*cm, 7.42*cm)
        elif len(options) <= 5:
            t=Table(data, 10.5*cm, 14.84*cm)
        else:
            t=Table(data, 10.5*cm, 29.7*cm)
    else:
        for option in options:
            o = str(option).rsplit("(",1)
            cell.append(Paragraph(circle+o[0], polloptionname))
            if len(o) > 1:
                cell.append(Paragraph("("+o[1], polloptiongroup))
            else:
                cell.append(Paragraph("&nbsp;", polloptiongroup))
        data= []
        for user in xrange(User.objects.count()/2):
            data.append([cell,cell])
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
