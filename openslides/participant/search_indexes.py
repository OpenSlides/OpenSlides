# -*- coding: utf-8 -*-

from haystack import indexes
from .models import User


class Index(indexes.SearchIndex, indexes.Indexable):
    text = indexes.EdgeNgramField(document=True, use_template=True)
    text = indexes.EdgeNgramField(document=True, use_template=True)
    modelfilter_name = "Participants"  # verbose_name of model
    modelfilter_value = "participant.user"  # 'app_name.model_name'

    def get_model(self):
        return User
