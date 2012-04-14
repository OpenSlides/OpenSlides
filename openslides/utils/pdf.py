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
from openslides.application.models import Application
from openslides.assignment.models import Assignment
from openslides.participant.models import Profile
from system import config
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


def firstPage(canvas, doc):
    canvas.saveState()
    # page header (with event information)
    canvas.setFont('Ubuntu', 10)
    canvas.setFillGray(0.4)
    canvas.drawString(2.75*cm, 28*cm, "%s | %s" % (config["event_name"], config["event_description"]))
    if config["event_date"] and config["event_location"]:
        canvas.drawString(2.75 * cm, 27.6 * cm, "%s, %s" % (config["event_date"], config["event_location"]))
    # time
    canvas.setFont('Ubuntu', 7)
    time = datetime.now().strftime(str(_("%Y-%m-%d %H:%Mh")))
    canvas.drawString(15 * cm, 28 * cm, _("Printed") + ": %s" % time)
    # title
    if doc.title:
        canvas.setFont('Ubuntu-Bold', 24)
        canvas.setFillGray(0)
        #canvas.drawCentredString(PAGE_WIDTH/2.0, PAGE_HEIGHT-108, doc.title)
        canvas.drawString(2.75 * cm, PAGE_HEIGHT - 108, doc.title)
    # footer (with page number)
    canvas.setFont('Ubuntu', 8)
    canvas.setFillGray(0.4)
    canvas.drawString(10 * cm, 1*cm, _("Page") + " %s" % doc.page)
    canvas.restoreState()


def laterPages(canvas, doc):
    canvas.saveState()
    # footer (with page number)
    canvas.setFont('Ubuntu', 7)
    canvas.setFillGray(0.4)
    canvas.drawString(10 * cm, 1 * cm, _("Page") + " %s" % doc.page)
    canvas.restoreState()


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
    system_url = config["system_url"]
    system_welcometext = config["system_welcometext"]
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
    ballot_papers_selection = config["assignment_pdf_ballot_papers_selection"]
    ballot_papers_number = config["assignment_pdf_ballot_papers_number"]
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
