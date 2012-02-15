from django.utils.translation import ugettext as _

from agenda.models import Item

def agenda_show():
    data = {}
    items = Item.objects.filter(parent=None)
    data['title'] = _("Agenda")
    data['items'] = items
    data['template'] = 'projector/AgendaSummary.html'
    return data
