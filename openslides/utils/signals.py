# -*- coding: utf-8 -*-

from django.dispatch import Signal


class TemplateManipulationSignal(Signal):
    """
    Derived class to ensure that the key extra_stylefiles and extra_javascript
    exist in the context dictionary.
    """
    def send(self, **kwargs):
        kwargs['context'].setdefault('extra_stylefiles', [])
        kwargs['context'].setdefault('extra_javascript', [])
        return super(TemplateManipulationSignal, self).send(**kwargs)


template_manipulation = TemplateManipulationSignal(providing_args=['request', 'context'])
