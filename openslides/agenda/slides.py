from django.utils.translation import ugettext as _

def agenda_show():
    from agenda.models import Item
    data = {}
    items = Item.objects.filter(parent=None)
    data['title'] = _("Agenda")
    data['items'] = items
    data['template'] = 'projector/AgendaSummary.html'
    return data
