#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.models
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the agenda app.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from datetime import datetime

from django.db import models
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext_lazy as _, ugettext_noop, ugettext

from mptt.models import MPTTModel, TreeForeignKey

from openslides.utils.exceptions import OpenSlidesError
from openslides.config.api import config
from openslides.projector.projector import SlideMixin
from openslides.projector.api import (
    register_slidemodel, get_slide_from_sid, register_slidefunc)
from openslides.utils.person.models import PersonField


class Item(MPTTModel, SlideMixin):
    """
    An Agenda Item

    MPTT-model. See http://django-mptt.github.com/django-mptt/
    """
    prefix = 'item'

    AGENDA_ITEM = 1
    ORGANIZATIONAL_ITEM = 2

    ITEM_TYPE = (
        (AGENDA_ITEM, _('Agenda item')),
        (ORGANIZATIONAL_ITEM, _('Organizational item')))

    title = models.CharField(null=True, max_length=255, verbose_name=_("Title"))
    """Title of the agenda item."""

    text = models.TextField(null=True, blank=True, verbose_name=_("Text"))
    """The optional text of the agenda item."""

    comment = models.TextField(null=True, blank=True, verbose_name=_("Comment"))
    """Optional comment to the agenda item. Will not be shoun to normal users."""

    closed = models.BooleanField(default=False, verbose_name=_("Closed"))
    """Flag, if the item is finished."""

    weight = models.IntegerField(default=0, verbose_name=_("Weight"))
    """Weight to sort the item in the agenda."""

    parent = TreeForeignKey('self', null=True, blank=True,
                            related_name='children')
    """The parent item in the agenda tree."""

    type = models.IntegerField(max_length=1, choices=ITEM_TYPE,
                               default=AGENDA_ITEM, verbose_name=_("Type"))
    """
    Type of the agenda item.

    See Agenda.ITEM_TYPE for more informations.
    """

    duration = models.CharField(null=True, blank=True, max_length=5,
                                verbose_name=_("Duration (hh:mm)"))
    """The intended duration for the topic."""

    related_sid = models.CharField(null=True, blank=True, max_length=63)
    """
    Slide-ID to another object to show it in the agenda.

    For example a motion or assignment.
    """

    speaker_list_closed = models.BooleanField(
        default=False, verbose_name=_("List of speakers is closed"))
    """
    True, if the list of speakers is closed.
    """

    def get_related_slide(self):
        """
        return the object, of which the item points.
        """
        object = get_slide_from_sid(self.related_sid, element=True)
        if object is None:
            self.title = 'Item for deleted slide: %s' % self.related_sid
            self.related_sid = None
            self.save()
            return self
        else:
            return object

    def get_related_type(self):
        """
        return the type of the releated slide.
        """
        return self.get_related_slide().prefix

    def print_related_type(self):
        """
        Print the type of the related item.

        For use in Template
        ??Why does {% trans item.print_related_type|capfirst %} not work??
        """
        return ugettext(self.get_related_type().capitalize())

    def get_title(self):
        """
        return the title of this item.
        """
        if self.related_sid is None:
            return self.title
        return self.get_related_slide().get_agenda_title()

    def get_title_supplement(self):
        """
        return a supplement for the title.
        """
        if self.related_sid is None:
            return ''
        try:
            return self.get_related_slide().get_agenda_title_supplement()
        except AttributeError:
            return '(%s)' % self.print_related_type()

    def slide(self):
        """
        Return a map with all Data for the Slide
        """
        if config['presentation_argument'] == 'summary':
            data = {
                'title': self.get_title(),
                'items': self.get_children(),
                'template': 'projector/AgendaSummary.html',
            }
        elif config['presentation_argument'] == 'show_list_of_speakers':
            speakers = Speaker.objects.filter(time=None, item=self.pk).order_by('weight')
            data = {'title': _('List of speakers for %s') % self.get_title(),
                    'template': 'projector/agenda_list_of_speaker.html',
                    'speakers': speakers}
        elif self.related_sid:
            data = self.get_related_slide().slide()
        else:
            data = {
                'item': self,
                'title': self.get_title(),
                'template': 'projector/AgendaText.html',
            }
        return data

    def set_closed(self, closed=True):
        """
        Changes the closed-status of the item.
        """
        self.closed = closed
        self.save()

    @property
    def weight_form(self):
        """
        Return the WeightForm for this item.
        """
        from openslides.agenda.forms import ItemOrderForm
        try:
            parent = self.parent.id
        except AttributeError:
            parent = 0
        initial = {
            'weight': self.weight,
            'self': self.id,
            'parent': parent,
        }
        return ItemOrderForm(initial=initial, prefix="i%d" % self.id)

    def delete(self, with_children=False):
        """
        Delete the Item.
        """
        if not with_children:
            for child in self.get_children():
                child.move_to(self.parent)
                child.save()
        super(Item, self).delete()
        Item.objects.rebuild()

    def get_absolute_url(self, link='view'):
        """
        Return the URL to this item. By default it is the Link to its
        slide

        link can be:
        * view
        * edit
        * delete
        """
        if link == 'view':
            if self.related_sid:
                return self.get_related_slide().get_absolute_url(link)
            return reverse('item_view', args=[str(self.id)])
        if link == 'edit':
            if self.related_sid:
                return self.get_related_slide().get_absolute_url(link)
            return reverse('item_edit', args=[str(self.id)])
        if link == 'delete':
            return reverse('item_delete', args=[str(self.id)])

    def __unicode__(self):
        return self.get_title()

    class Meta:
        permissions = (
            ('can_see_agenda', ugettext_noop("Can see agenda")),
            ('can_manage_agenda', ugettext_noop("Can manage agenda")),
            ('can_see_orga_items', ugettext_noop("Can see orga items and time scheduling of agenda")),
        )

    class MPTTMeta:
        order_insertion_by = ['weight']


class SpeakerManager(models.Manager):
    def add(self, person, item):
        if self.filter(person=person, item=item, time=None).exists():
            raise OpenSlidesError(_('%s is allready on the list of speakers from item %d') % (person, item.id))
        weight = (self.filter(item=item).aggregate(
            models.Max('weight'))['weight__max'] or 0)
        return self.create(item=item, person=person, weight=weight + 1)


class Speaker(models.Model):
    """
    Model for the Speaker list.
    """

    objects = SpeakerManager()

    person = PersonField()
    item = models.ForeignKey(Item)
    time = models.TimeField(null=True)
    weight = models.IntegerField(null=True)

    class Meta:
        permissions = (
            ('can_be_speaker', ugettext_noop('Can be speaker')),
        )

    def __unicode__(self):
        return unicode(self.person)

    def get_absolute_url(self, link='detail'):
        if link == 'detail' or link == 'view':
            return self.person.get_absolute_url('detail')
        if link == 'delete':
            return reverse('agenda_speaker_delete',
                           args=[self.item.pk, self.pk])

    def speak(self):
        self.weight = None
        self.time = datetime.now()
        self.save()
