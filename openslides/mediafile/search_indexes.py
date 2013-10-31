# -*- coding: utf-8 -*-

from haystack import indexes
from .models import Mediafile


class Index(indexes.SearchIndex, indexes.Indexable):
    text = indexes.EdgeNgramField(document=True, use_template=True)
    modelfilter_name = "Files"  # verbose_name of model
    modelfilter_value = "mediafile.mediafile"  # 'app_name.model_name'

    def get_model(self):
        return Mediafile
