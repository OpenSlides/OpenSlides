# -*- coding: utf-8 -*-

from haystack import indexes
from .models import Item


class Index(indexes.SearchIndex, indexes.Indexable):
    text = indexes.EdgeNgramField(document=True, use_template=True)
    modelfilter_name = "Agenda"  # verbose_name of model
    modelfilter_value = "agenda.item"  # 'app_name.model_name'

    def get_model(self):
        return Item
