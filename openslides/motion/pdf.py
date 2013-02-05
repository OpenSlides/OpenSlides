#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.pdf
    ~~~~~~~~~~~~~~~~~~~~~

    Functions to generate the PDFs for the motion app.
"""

from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, PageBreak, Paragraph, Spacer, Table, TableStyle)
from django.utils.translation import ugettext as _

from openslides.config.models import config
from openslides.utils.pdf import stylesheet

from .models import Motion


def motions_to_pdf(pdf):
    """Create a PDF with all motions."""

    motions = Motion.objects.all()
    all_motion_cover(pdf, motions)
    for motion in motions:
        pdf.append(PageBreak())
        motion_to_pdf(pdf, motion)


def motion_to_pdf(pdf, motion):
    """Create a PDF for one motion."""

    pdf.append(Paragraph(_("Motion: %s") % motion.title, stylesheet['Heading1']))

    motion_data = []

    # submitter
    cell1a = []
    cell1a.append(Spacer(0, 0.2 * cm))
    cell1a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Submitter"),
                            stylesheet['Heading4']))
    cell1b = []
    cell1b.append(Spacer(0, 0.2 * cm))
    cell1b.append(Paragraph(unicode(motion.submitter), stylesheet['Normal']))
    motion_data.append([cell1a, cell1b])

    # TODO: choose this in workflow
    if motion.state.edit_as_submitter:
        # Cell for the signature
        cell2a = []
        cell2b = []
        cell2a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" %
                                _("Signature"), stylesheet['Heading4']))
        cell2b.append(Paragraph(42 * "_", stylesheet['Signaturefield']))
        cell2b.append(Spacer(0, 0.1 * cm))
        cell2b.append(Spacer(0, 0.2 * cm))
        motion_data.append([cell2a, cell2b])

    # supporters
    if config['motion_min_supporters']:
        cell3a = []
        cell3b = []
        cell3a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font><seqreset id='counter'>"
                                % _("Supporters"), stylesheet['Heading4']))
        supporters = motion.supporter.all()
        for supporter in supporters:
            cell3b.append(Paragraph("<seq id='counter'/>.&nbsp; %s" % unicode(supporter),
                                    stylesheet['Signaturefield']))
        if motion.state.support:
            for count in range(config['motion_min_supporters'] - supporters.count()):
                cell3b.append(Paragraph("<seq id='counter'/>.&nbsp;" + 42 * "_",
                                        stylesheet['Signaturefield']))
        cell3b.append(Spacer(0, 0.2 * cm))
        motion_data.append([cell3a, cell3b])

    ## # status
    ## cell4a = []
    ## cell4b = []
    ## note = " ".join(motion.notes)
    ## cell4a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Status"), stylesheet['Heading4']))
    ## if note != "":
        ## if motion.status == "pub":
            ## cell4b.append(Paragraph(note, stylesheet['Normal']))
        ## else:
            ## cell4b.append(Paragraph("%s | %s" % (motion.get_status_display(), note), stylesheet['Normal']))
    ## else:
        ## cell4b.append(Paragraph("%s" % motion.get_status_display(), stylesheet['Normal']))
    ## data.append([cell4a, cell4b])

    # Motion state
    cell4a = []
    cell4b = []
    cell4a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("State"),
                            stylesheet['Heading4']))
    cell4b.append(Paragraph(motion.state.name, stylesheet['Normal']))
    motion_data.append([cell4a, cell4b])

    # Version number (aid)
    if motion.versions.count() > 1:
        cell5a = []
        cell5b = []
        cell5a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" % _("Version"),
                                stylesheet['Heading4']))
        cell5b.append(Paragraph("%s" % motion.version.version_number, stylesheet['Normal']))
        motion_data.append([cell5a, cell5b])

    # voting results
    polls = []
    for poll in motion.polls.all():
        if not poll.has_votes():
            continue
        polls.append(poll)

    if polls:
        cell6a = []
        cell6b = []
        cell6a.append(Paragraph("<font name='Ubuntu-Bold'>%s:</font>" %
                                _("Vote results"), stylesheet['Heading4']))
        ballotcounter = 0
        for poll in polls:
            ballotcounter += 1
            option = poll.get_options()[0]
            yes, no, abstain, invalid, votecast = (
                option['Yes'], option['No'], option['Abstain'],
                poll.print_voteinvalid(), poll.print_votecast())

            if len(polls) > 1:
                cell6b.append(Paragraph("%s. %s" % (ballotcounter, _("Vote")),
                                        stylesheet['Bold']))
            cell6b.append(Paragraph(
                "%s: %s <br/> %s: %s <br/> %s: %s <br/> %s: %s <br/> %s: %s" %
                (_("Yes"), yes, _("No"), no, _("Abstention"), abstain, _("Invalid"),
                 invalid, _("Votes cast"), votecast), stylesheet['Normal']))
            cell6b.append(Spacer(0, 0.2 * cm))
        motion_data.append([cell6a, cell6b])

    # Creating Table
    table = Table(motion_data)
    table._argW[0] = 4.5 * cm
    table._argW[1] = 11 * cm
    table.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 1, colors.black),
                               ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    pdf.append(table)
    pdf.append(Spacer(0, 1 * cm))

    pdf.append(Paragraph(motion.title, stylesheet['Heading3']))
    pdf.append(Paragraph(motion.text.replace('\r\n', '<br/>'), stylesheet['Paragraph']))
    if motion.reason:
        pdf.append(Paragraph(_("Reason:"), stylesheet['Heading3']))
        pdf.append(Paragraph(motion.reason.replace('\r\n',  '<br/>'), stylesheet['Paragraph']))
    return pdf


def all_motion_cover(pdf, motions):
    """Create a coverpage for all motions."""
    pdf.append(Paragraph(config["motion_pdf_title"], stylesheet['Heading1']))

    preamble = config["motion_pdf_preamble"]
    if preamble:
        pdf.append(Paragraph("%s" % preamble.replace('\r\n', '<br/>'), stylesheet['Paragraph']))

    pdf.append(Spacer(0, 0.75 * cm))

    if not motions:
        pdf.append(Paragraph(_("No motions available."), stylesheet['Heading3']))
    else:
        for motion in motions:
            pdf.append(Paragraph(motion.title, stylesheet['Heading3']))
