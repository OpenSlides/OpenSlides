# -*- coding: utf-8 -*-

from haystack import indexes
from .models import Motion


class Index(indexes.SearchIndex, indexes.Indexable):
    text = indexes.EdgeNgramField(document=True, use_template=True)
    modelfilter_name = "Motions"  # verbose_name of model
    modelfilter_value = "motion.motion"  # 'app_name.model_name'

    def get_model(self):
        return Motion
