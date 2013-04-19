#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.pdf
    ~~~~~~~~~~~~~~~~~~~~

    Additional definitions for creating PDF documents.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from datetime import datetime
from os.path import join as path_join

from reportlab.lib import colors
from reportlab.lib.styles import StyleSheet1, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.rl_config import defaultPageSize

from django.conf import settings
from django.utils import formats
from django.utils.translation import ugettext as _

from openslides.config.api import config


# register new truetype fonts
pdfmetrics.registerFont(TTFont(
    'Ubuntu', path_join(settings.SITE_ROOT, 'static/fonts/Ubuntu-R.ttf')))
pdfmetrics.registerFont(TTFont(
    'Ubuntu-Bold', path_join(settings.SITE_ROOT, 'static/fonts/Ubuntu-B.ttf')))
pdfmetrics.registerFont(TTFont(
    'Ubuntu-Italic', path_join(settings.SITE_ROOT, 'static/fonts/Ubuntu-RI.ttf')))


# set style information
PAGE_HEIGHT = defaultPageSize[1]
PAGE_WIDTH = defaultPageSize[0]


# set custom stylesheets
stylesheet = StyleSheet1()
stylesheet.add(ParagraphStyle(
    name='Normal',
    fontSize=10,
    leading=12,
))
stylesheet.add(ParagraphStyle(
    name='Paragraph',
    parent=stylesheet['Normal'],
    leading=14,
    spaceAfter=15
))
stylesheet.add(ParagraphStyle(
    name='InnerParagraph',
    parent=stylesheet['Normal'],
    leading=14,
    spaceBefore=5,
    spaceAfter=5,
    bulletIndent=-15,
    bulletFontSize=8,
    bulletColor=colors.grey
))
stylesheet.add(ParagraphStyle(
    name='InnerListParagraph',
    parent=stylesheet['InnerParagraph'],
    bulletIndent=10,
    bulletFontSize=10,
    bulletColor=colors.black,
    leftIndent=30
))
stylesheet.add(ParagraphStyle(
    name='InnerMonotypeParagraph',
    parent=stylesheet['InnerParagraph'],
    fontName='Courier',
))
stylesheet.add(ParagraphStyle(
    name='InnerH1Paragraph',
    parent=stylesheet['InnerParagraph'],
    fontName='Ubuntu-Bold',
    fontSize=16,
    spaceBefore=20,
    spaceAfter=10,
))
stylesheet.add(ParagraphStyle(
    name='InnerH2Paragraph',
    parent=stylesheet['InnerH1Paragraph'],
    fontSize=12,
    spaceBefore=20,
    spaceAfter=10,
))
stylesheet.add(ParagraphStyle(
    name='InnerH3Paragraph',
    parent=stylesheet['InnerH2Paragraph'],
    fontSize=10,
    spaceBefore=15,
    spaceAfter=5,
))
stylesheet.add(ParagraphStyle(
    name='Small',
    parent=stylesheet['Normal'],
    fontSize=8
))
stylesheet.add(ParagraphStyle(
    name='Italic',
    parent=stylesheet['Normal'],
    fontName='Ubuntu-Italic',
    spaceAfter=5
))
stylesheet.add(ParagraphStyle(
    name='Bold',
    parent=stylesheet['Normal'],
    fontName='Ubuntu-Bold',
))
stylesheet.add(ParagraphStyle(
    name='Heading1',
    parent=stylesheet['Bold'],
    fontSize=24,
    leading=30,
    spaceAfter=6,
), alias='h1')
stylesheet.add(ParagraphStyle(
    name='Heading2',
    parent=stylesheet['Bold'],
    fontSize=14,
    leading=24,
    spaceAfter=10,
), alias='h2')
stylesheet.add(ParagraphStyle(
    name='Heading3',
    parent=stylesheet['Bold'],
    fontSize=12,
    leading=20,
), alias='h3')
stylesheet.add(ParagraphStyle(
    name='Heading4',
    parent=stylesheet['Bold'],
    fontSize=10,
    leading=20,
))
stylesheet.add(ParagraphStyle(
    name='Item',
    parent=stylesheet['Normal'],
    fontSize=14,
    leading=14,
    leftIndent=0,
    spaceAfter=15,
))
stylesheet.add(ParagraphStyle(
    name='Subitem',
    parent=stylesheet['Normal'],
    fontSize=10,
    leading=10,
    leftIndent=20,
    spaceAfter=15))
stylesheet.add(ParagraphStyle(
    name='Tablecell',
    parent=stylesheet['Normal'],
    fontSize=9))
stylesheet.add(ParagraphStyle(name='Signaturefield',
                              parent=stylesheet['Normal'],
                              spaceBefore=15)
               )

# Ballot stylesheets
stylesheet.add(ParagraphStyle(name='Ballot_title',
                              parent=stylesheet['Bold'],
                              fontSize=12,
                              leading=14,
                              leftIndent=30),
               )
stylesheet.add(ParagraphStyle(name='Ballot_subtitle',
                              parent=stylesheet['Normal'],
                              fontSize=10,
                              leading=12,
                              leftIndent=30,
                              rightIndent=20,
                              spaceAfter=5),
               )
stylesheet.add(ParagraphStyle(name='Ballot_description',
                              parent=stylesheet['Normal'],
                              fontSize=7,
                              leading=10,
                              leftIndent=30),
               )
stylesheet.add(ParagraphStyle(name='Ballot_option',
                              parent=stylesheet['Normal'],
                              fontSize=12,
                              leading=24,
                              leftIndent=30),
               )
stylesheet.add(ParagraphStyle(name='Ballot_option_name',
                              parent=stylesheet['Normal'],
                              fontSize=12,
                              leading=15,
                              leftIndent=30),
               )
stylesheet.add(ParagraphStyle(name='Ballot_option_group',
                              parent=stylesheet['Normal'],
                              fontSize=8,
                              leading=15,
                              leftIndent=30),
               )
stylesheet.add(ParagraphStyle(name='Ballot_option_YNA',
                              parent=stylesheet['Normal'],
                              fontSize=12,
                              leading=15,
                              leftIndent=49,
                              spaceAfter=18),
               )
stylesheet.add(ParagraphStyle(name='Ballot_option_group_right',
                              parent=stylesheet['Normal'],
                              fontSize=8,
                              leading=16,
                              leftIndent=49),
               )
# Password paper stylesheets
stylesheet.add(ParagraphStyle(name='Password_title',
                              parent=stylesheet['Ballot_title'],
                              leftIndent=0),
               )
stylesheet.add(ParagraphStyle(name='Password_subtitle',
                              parent=stylesheet['Ballot_subtitle'],
                              leftIndent=0),
               )
stylesheet.add(ParagraphStyle(name='Monotype',
                              parent=stylesheet['Normal'],
                              fontName='Courier',
                              fontSize=12,
                              leading=24,
                              leftIndent=0),
               )
stylesheet.add(ParagraphStyle(name='Badge_title',
                              parent=stylesheet['Bold'],
                              fontSize=16,
                              leading=22,
                              leftIndent=30),
               )
stylesheet.add(ParagraphStyle(name='Badge_subtitle',
                              parent=stylesheet['Normal'],
                              fontSize=12,
                              leading=24,
                              leftIndent=30),
               )
stylesheet.add(ParagraphStyle(
    name='Badge_italic',
    parent=stylesheet['Italic'],
    fontSize=12,
    leading=24,
    leftIndent=30,
))
stylesheet.add(ParagraphStyle(
    name='Badge_qrcode',
    fontSize=12,
    leftIndent=190,
))


def firstPage(canvas, doc):
    canvas.saveState()
    # page header (with event information)
    canvas.setFont('Ubuntu', 10)
    canvas.setFillGray(0.4)

    title_line = u"%s | %s" % (config["event_name"],
                               config["event_description"])
    if len(title_line) > 75:
        title_line = "%s ..." % title_line[:70]
    canvas.drawString(2.75 * cm, 28 * cm, title_line)
    if config["event_date"] and config["event_location"]:
        canvas.drawString(2.75 * cm, 27.6 * cm, u"%s, %s"
                          % (config["event_date"], config["event_location"]))

    # time
    canvas.setFont('Ubuntu', 7)
    time = formats.date_format(datetime.now(), 'DATETIME_FORMAT')
    canvas.drawString(15 * cm, 28 * cm, _("As of: %s") % time)

    # title
    if doc.title:
        canvas.setFont('Ubuntu-Bold', 24)
        canvas.setFillGray(0)
        canvas.drawString(2.75 * cm, PAGE_HEIGHT - 108, doc.title)

    # footer (with page number)
    canvas.setFont('Ubuntu', 8)
    canvas.setFillGray(0.4)
    canvas.drawString(10 * cm, 1 * cm, _("Page %s") % doc.page)
    canvas.restoreState()


def laterPages(canvas, doc):
    canvas.saveState()
    # footer (with page number)
    canvas.setFont('Ubuntu', 7)
    canvas.setFillGray(0.4)
    canvas.drawString(10 * cm, 1 * cm, _("Page %s") % doc.page)
    canvas.restoreState()
