# -*- coding: utf-8 -*-

from django.dispatch import Signal

receive_persons = Signal(providing_args=['person_prefix_filter', 'id_filter'])
