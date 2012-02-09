#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.agenda.models
    ~~~~~~~~~~~~~~~~~~~~~~~~

    Models for the agenda app.

    :copyright: 2011 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

try:
    import json
except ImportError:
    import simplejson as json

from django.db import models
from django.utils.translation import ugettext as _

from projector.models import Slide
from projector.api import register_slidemodel
from system.api import config_set
from agenda.api import is_summary


class Item(models.Model, Slide):
    """
    An Agenda Item
    """
    prefix = 'item'

    title = models.CharField(max_length=100, verbose_name=_("Title"))
    text = models.TextField(null=True, blank=True, verbose_name=_("Text"))
    transcript = models.TextField(null=True, blank=True, verbose_name=_("Transcript"))
    closed = models.BooleanField(default=False, verbose_name=_("Closed"))
    weight = models.IntegerField(default=0, verbose_name=_("Weight"))
    parent = models.ForeignKey('self', blank=True, null=True)


    def slide(self):
        """
        Return a map with all Data for the Slide
        """
        data = {
            'item': self,
            'title': self.title,
            'template': 'projector/AgendaText.html',
        }

        if is_summary():
            data['items'] = self.children.filter(hidden=False)
            data['template'] = 'projector/AgendaSummary.html'
        return data

    def set_active(self, summary=False):
        """
        Appoint this item as the active one.
        """
        Slide.set_active(self)
        if summary:
            config_set("agenda_summary", True)
        else:
            config_set("agenda_summary", '')

    def set_closed(self, closed=True):
        """
        Changes the closed-status of the item.
        """
        self.closed = closed
        self.save()

    @property
    def parents(self):
        """
        Return the parent of this item, and the parent's partent and so
        furth a list.
        """
        parents = []
        item = self
        while item.parent is not None:
            parents.append(item.parent)
            item = item.parent
        return parents

    @property
    def active_parent(self):
        """
        Return True if the item has a active parent
        """
        sid = get_active_slide(only_sid=True).split()
        if  len(sid) == 2 and sid[0] == self.prefix:
            if sid[1] in [parent.id for parent in self.parents]:
                return True
        return False

    @property
    def children(self):
        """
        Return a list of all childitems from the next generation. The list
        is ordert by weight.
        """
        return self.item_set.order_by("weight")

    @property
    def weight_form(self):
        """
        Return the WeightForm for this item.
        """
        from agenda.forms import ItemOrderForm
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

    @models.permalink
    def get_absolute_url(self, link='view'):
        """
        Return the URL to this item. By default it is the Link to its
        slide

        link can be:
        * view
        * delete
        """
        if link == 'view':
            return ('item_view', [str(self.id)])
        if link == 'delete':
            return ('item_delete', [str(self.id)])

    def __unicode__(self):
        return self.title

    class Meta:
        permissions = (
            ('can_see_agenda', "Can see agenda"),
            ('can_manage_agenda', "Can manage agenda"),
            ('can_see_projector', "Can see projector"),
        )
        ordering = ['weight']


ItemText = Item # ItemText is Depricated

register_slidemodel(Item)


