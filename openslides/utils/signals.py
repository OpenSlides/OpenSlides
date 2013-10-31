# -*- coding: utf-8 -*-

from django.dispatch import Signal

template_manipulation = Signal(providing_args=['request', 'context'])
