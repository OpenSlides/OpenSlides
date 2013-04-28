import datetime
from haystack.indexes import *
from haystack import site
from openslides.agenda.models import Item


class AgendaIndex(RealTimeSearchIndex):
    title = CharField(model_attr='title', null=True)
    text = CharField(document=True, model_attr='text', null=True)


site.register(Item, AgendaIndex)
