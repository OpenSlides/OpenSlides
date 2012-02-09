from django.utils.translation import ugettext as _

from projector.api import register_slidefunc
from agenda.models import Item

def agenda_show():
    data = {}
    items = Item.objects.filter(parent=None) \
            .filter(hidden=False).order_by('weight')
    data['title'] = _("Agenda")
    data['items'] = items
    data['template'] = 'projector/AgendaSummary.html'
    return data
