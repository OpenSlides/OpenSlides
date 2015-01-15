# -*- coding: utf-8 -*-

from django.core.exceptions import ImproperlyConfigured
from django.core.urlresolvers import reverse

from openslides.utils.utils import int_or_none


class RelatedModelMixin(object):
    """
    Mixin for motion related models, that appear on the motion slide.
    """

    def save(self, *args, **kwargs):
        """
        Saves the model and updates the projector, if the motion in on it.
        """
        from .api import update_projector
        value = super(RelatedModelMixin, self).save(*args, **kwargs)
        if self.get_related_model().is_active_slide():
            update_projector()
        return value

    def delete(self, *args, **kwargs):
        """
        Deletes the model and updates the projector, if the motion in on it.
        """
        from .api import update_projector
        value = super(RelatedModelMixin, self).delete(*args, **kwargs)
        if self.get_related_model().is_active_slide():
            update_projector()
        return value

    def get_related_model(self):
        """
        Return the pk of the related model.
        """
        raise ImproperlyConfigured(
            '%s has to have a method "get_related_model_pk"' % type(self))


class SlideMixin(object):
    """
    A Mixin for a Django-Model, for making the model a slide.
    """

    slide_callback_name = None
    """
    Name of the callback to render the model as slide.
    """

    def save(self, *args, **kwargs):
        """
        Updates the projector, if the object is on the projector and changed.
        """
        from openslides.projector.api import update_projector
        value = super(SlideMixin, self).save(*args, **kwargs)
        if self.is_active_slide():
            update_projector()
        return value

    def delete(self, *args, **kwargs):
        """
        Updates the projector if the object is on the projector and is deleted.
        """
        from openslides.projector.api import update_projector
        # Checking active slide has to be done before calling super().delete()
        # because super().delete() deletes the object and than we have no
        # access to the former existing primary key any more. But updating
        # projector has to be done after deleting the object of course.
        update_required = self.is_active_slide()
        value = super(SlideMixin, self).delete(*args, **kwargs)
        if update_required:
            update_projector()
        return value

    def get_absolute_url(self, link='projector'):
        """
        Return the url to activate the slide, if link == 'projector'.
        """
        if link in ('projector', 'projector_preview'):
            url_name = {'projector': 'projector_activate_slide',
                        'projector_preview': 'projector_preview'}[link]
            value = '%s?pk=%d' % (
                reverse(url_name,
                        args=[self.slide_callback_name]),
                self.pk)
        else:
            value = super(SlideMixin, self).get_absolute_url(link)
        return value

    def is_active_slide(self):
        """
        Return True, if the the slide is the active slide.
        """
        from openslides.projector.api import get_active_slide
        active_slide = get_active_slide()
        slide_pk = int_or_none(active_slide.get('pk', None))
        return (active_slide['callback'] == self.slide_callback_name and
                self.pk == slide_pk)

    def get_slide_context(self, **context):
        """
        Returns the context for the template which renders the slide.
        """
        slide_name = self._meta.object_name.lower()
        context.update({'slide': self,
                        slide_name: self})
        return context
