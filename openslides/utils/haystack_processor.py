from django.db import models
from haystack.signals import RealtimeSignalProcessor


class OpenSlidesProcessor(RealtimeSignalProcessor):
    def setup(self):
        # Naive (listen to all model saves).
        super(OpenSlidesProcessor, self).setup()
        models.signals.m2m_changed.connect(self.handle_many_to_many)

    def teardown(self):
        # Naive (listen to all model saves).
        super(OpenSlidesProcessor, self).teardown()
        models.signals.m2m_changed.disconnect(self.handle_many_to_many)

    def handle_many_to_many(self, sender, instance, **kwargs):
        """
        Given an individual model instance, determine which backends the
        update should be sent to & update the object on those backends.
        """
        model_class = type(instance)
        if kwargs['action'] == 'post_add' or kwargs['action'] == 'post_clear' or kwargs['action'] == 'post_remove':
            self.handle_save(model_class, instance, **kwargs)
