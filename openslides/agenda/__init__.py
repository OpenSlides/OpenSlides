from projector.api import register_slidefunc
from agenda.slides import agenda_show

register_slidefunc('agenda_show', agenda_show)
