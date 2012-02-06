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

from projector.models import Element
from projector.api import element_register
from system.api import config_set
from application.models import Application
from poll.models import Poll
from assignment.models import Assignment


class Item(models.Model, Element):
    """
    An Agenda Item
    """
    title = models.CharField(max_length=100, verbose_name=_("Title"))
    text = models.TextField(null=True, blank=True, verbose_name=_("Text"))
    transcript = models.TextField(null=True, blank=True, verbose_name=_("Transcript"))
    closed = models.BooleanField(default=False, verbose_name=_("Closed"))
    weight = models.IntegerField(default=0, verbose_name=_("Weight"))
    parent = models.ForeignKey('self', blank=True, null=True)
    hidden = models.BooleanField(default=False,
                                     verbose_name=_("Hidden (visible for agenda manager only)"))
    prefix = 'item'


    def slide(self):
        """
        Return a map with all Data for the Slide
        """
        return {
            'item': self,
            'title': self.title,
            'template': 'projector/AgendaText.html',
        }

    @property
    def active_parent(self):
        """
        Return True if the item has a activ parent
        """
        if get_active_element(only_id=True) in \
        [parent.id for parent in self.parents]:
            return True
        return False

    def set_active(self, summary=False):
        """
        Appoint this item as the active one.
        """
        Element.set_active(self)
        if summary:
            config_set("summary", True)
        else:
            config_set("summary", '')

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
    def children(self):
        """
        Return a list of all childitems from the next generation. The list
        is ordert by weight. The childitems are not cast, so there are only
        Item-objects and not Item-type objects.
        """
        return self.item_set.order_by("weight")

    @property
    def weight_form(self):
        """
        Return the WeightForm for this item.
        """
        from agenda.forms import ElementOrderForm
        try:
            parent = self.parent.id
        except AttributeError:
            parent = 0
        initial = {
            'weight': self.weight,
            'self': self.id,
            'parent': parent,
        }
        return ElementOrderForm(initial=initial, prefix="i%d" % self.id)

    def edit_form(self, post=None):
        """
        Return the EditForm for this item.
        """
        try:
            return self._edit_form
        except AttributeError:
            from agenda.forms import MODELFORM
            try:
                form = MODELFORM[self.type]
            except KeyError:
                raise NameError(_("No Form for itemtype %s") % self.type)

            self._edit_form = form(post, instance=self)
            return self._edit_form

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

    @property
    def json(self):
        """
        Return the model as jquery data
        """
        return json.dumps({
                'id': self.id,
                'active': self.active,
            })

    def __unicode__(self):
        return self.title

    def cast(self):
        try:
            return self.realobject
        except AttributeError:
            self.realobject = super(Item, self).cast()
            return self.realobject

    @property
    def type(self):
        """
        Return the name of the class from this item
        """
        try:
            return self._type
        except AttributeError:
            self._type = self.cast().__class__.__name__
            return self._type

    class Meta:
        permissions = (
            ('can_see_agenda', "Can see agenda"),
            ('can_manage_agenda', "Can manage agenda"),
            ('can_see_projector', "Can see projector"),
        )


ItemText = Item # ItemText is Depricated



element_register(Item.prefix, Item)
