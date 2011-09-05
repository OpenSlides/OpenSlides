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

from model_utils.models import InheritanceCastModel

from openslides.agenda.api import get_active_item
from openslides.system.api import config_set
from openslides.application.models import Application
from openslides.poll.models import Poll
from openslides.assignment.models import Assignment


class Item(InheritanceCastModel):
    """
    The BasisItem.
    Has all the attributes all Items need.
    """
    title = models.CharField(max_length=100, verbose_name=_("Title"))
    closed = models.BooleanField(default=False, verbose_name=_("Closed"))
    weight = models.IntegerField(default=0, verbose_name=_("Weight"))
    parent = models.ForeignKey('self', blank=True, null=True)
    hidden = models.BooleanField(default=False,
                                     verbose_name=_("Hidden (visible for agenda manager only)"))

    @property
    def active(self):
        """
        Return True, if the the item is the active one.
        """
        return True if get_active_item(only_id=True) == self.id else False

    @property
    def active_parent(self):
        """
        Return True if the item has a activ parent
        """
        if get_active_item(only_id=True) in \
        [parent.id for parent in self.parents]:
            return True
        return False

    def set_active(self, summary=False):
        """
        Appoint this item as the active one.
        """
        config_set("presentation", self.id)
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
        beamer-view.

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


class ItemText(Item):
    """
    An Item with a TextField.
    """
    text = models.TextField(null=True, blank=True, verbose_name=_("Text"))

    class Meta:
        pass


class ItemApplication(Item):
    """
    An Item which is connected to an application.
    """
    application = models.ForeignKey(Application, verbose_name=_("Application"))


class ItemAssignment(Item):
    """
    An Item which is connected to an assignment.
    """
    assignment = models.ForeignKey(Assignment, verbose_name=_("Election"))


class ItemPoll(Item):
    """
    An Item which is connected to a poll
    """
    poll = models.ForeignKey(Poll, verbose_name=_("Poll"))
