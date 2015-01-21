# -*- coding: utf-8 -*-

from cgi import escape

from django.utils.translation import ugettext as _
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (LongTable, PageBreak, Paragraph, Spacer, Table,
                                TableStyle)

from openslides.config.api import config
from openslides.utils.pdf import stylesheet

from .models import User


def participants_to_pdf(pdf):
    """
    Create a list of all participants as PDF
    """
    data = [['#', _('Title'), _('Last Name'), _('First Name'),
             _('Structure level'), _('Group')]]
    if config['participant_sort_users_by_first_name']:
        sort = 'first_name'
    else:
        sort = 'last_name'
    counter = 0
    for user in User.objects.all().order_by(sort):
        counter += 1
        groups = ''
        for group in user.groups.all():
            if group.pk != 2:
                groups += "%s<br/>" % escape(unicode(_(group.name)))
        data.append([
            counter,
            Paragraph(user.title, stylesheet['Tablecell']),
            Paragraph(escape(user.last_name), stylesheet['Tablecell']),
            Paragraph(escape(user.first_name), stylesheet['Tablecell']),
            Paragraph(escape(user.structure_level), stylesheet['Tablecell']),
            Paragraph(groups, stylesheet['Tablecell'])])
    t = LongTable(data, style=[
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LINEABOVE', (0, 0), (-1, 0), 2, colors.black),
        ('LINEABOVE', (0, 1), (-1, 1), 1, colors.black),
        ('LINEBELOW', (0, -1), (-1, -1), 2, colors.black),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1),
            (colors.white, (.9, .9, .9)))])
    t._argW[0] = 0.75 * cm
    pdf.append(t)
    return pdf


def participants_passwords_to_pdf(pdf):
    """
    Create access data sheets for all participants as PDF
    """
    participant_pdf_wlan_ssid = config["participant_pdf_wlan_ssid"] or "-"
    participant_pdf_wlan_password = config["participant_pdf_wlan_password"] or "-"
    participant_pdf_wlan_encryption = config["participant_pdf_wlan_encryption"] or "-"
    participant_pdf_url = config["participant_pdf_url"] or "-"
    participant_pdf_welcometitle = config["participant_pdf_welcometitle"]
    participant_pdf_welcometext = config["participant_pdf_welcometext"]
    if config['participant_sort_users_by_first_name']:
        sort = 'first_name'
    else:
        sort = 'last_name'
    qrcode_size = 2 * cm
    # qrcode for system url
    qrcode_url = QrCodeWidget(participant_pdf_url)
    qrcode_url.barHeight = qrcode_size
    qrcode_url.barWidth = qrcode_size
    qrcode_url.barBorder = 0
    qrcode_url_draw = Drawing(45, 45)
    qrcode_url_draw.add(qrcode_url)
    # qrcode for wlan
    text = "WIFI:S:%s;T:%s;P:%s;;" % (participant_pdf_wlan_ssid, participant_pdf_wlan_encryption, participant_pdf_wlan_password)
    qrcode_wlan = QrCodeWidget(text)
    qrcode_wlan.barHeight = qrcode_size
    qrcode_wlan.barWidth = qrcode_size
    qrcode_wlan.barBorder = 0
    qrcode_wlan_draw = Drawing(45, 45)
    qrcode_wlan_draw.add(qrcode_wlan)

    for user in User.objects.all().order_by(sort):
        pdf.append(Paragraph(escape(unicode(user)), stylesheet['h1']))
        pdf.append(Spacer(0, 1 * cm))
        data = []
        # WLAN access data
        cell = []
        cell.append(Paragraph(_("WLAN access data"),
                    stylesheet['h2']))
        cell.append(Paragraph("%s:" % _("WLAN name (SSID)"),
                    stylesheet['formfield']))
        cell.append(Paragraph(escape(participant_pdf_wlan_ssid),
                    stylesheet['formfield_value']))
        cell.append(Paragraph("%s:" % _("WLAN password"),
                    stylesheet['formfield']))
        cell.append(Paragraph(escape(participant_pdf_wlan_password),
                    stylesheet['formfield_value']))
        cell.append(Paragraph("%s:" % _("WLAN encryption"),
                    stylesheet['formfield']))
        cell.append(Paragraph(escape(participant_pdf_wlan_encryption),
                    stylesheet['formfield_value']))
        cell.append(Spacer(0, 0.5 * cm))
        # OpenSlides access data
        cell2 = []
        cell2.append(Paragraph(_("OpenSlides access data"),
                     stylesheet['h2']))
        cell2.append(Paragraph("%s:" % _("Username"),
                     stylesheet['formfield']))
        cell2.append(Paragraph(escape(user.username),
                     stylesheet['formfield_value']))
        cell2.append(Paragraph("%s:" % _("Password"),
                     stylesheet['formfield']))
        cell2.append(Paragraph(escape(user.default_password),
                     stylesheet['formfield_value']))
        cell2.append(Paragraph("URL:",
                     stylesheet['formfield']))
        cell2.append(Paragraph(escape(participant_pdf_url),
                     stylesheet['formfield_value']))
        data.append([cell, cell2])
        # QRCodes
        cell = []
        if participant_pdf_wlan_ssid != "-" and participant_pdf_wlan_encryption != "-":
            cell.append(qrcode_wlan_draw)
            cell.append(Paragraph(_("Scan this QRCode to connect WLAN."),
                        stylesheet['qrcode_comment']))
        cell2 = []
        if participant_pdf_url != "-":
            cell2.append(qrcode_url_draw)
            cell2.append(Paragraph(_("Scan this QRCode to open URL."),
                         stylesheet['qrcode_comment']))
        data.append([cell, cell2])
        # build table
        table = Table(data)
        table._argW[0] = 8 * cm
        table._argW[1] = 8 * cm
        table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))
        pdf.append(table)
        pdf.append(Spacer(0, 2 * cm))

        # welcome title and text
        pdf.append(Paragraph(escape(participant_pdf_welcometitle), stylesheet['h2']))
        pdf.append(Paragraph(escape(participant_pdf_welcometext).replace('\r\n', '<br/>'),
                   stylesheet['Paragraph12']))
        pdf.append(PageBreak())
    return pdf
