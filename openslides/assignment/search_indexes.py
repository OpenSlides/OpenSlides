# -*- coding: utf-8 -*-

from haystack import indexes
from .models import Assignment


class Index(indexes.SearchIndex, indexes.Indexable):
    text = indexes.EdgeNgramField(document=True, use_template=True)
    modelfilter_name = "Elections"  # verbose_name of model
    modelfilter_value = "assignment.assignment"  # 'app_name.model_name'

    def get_model(self):
        return Assignment
