#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.person
    ~~~~~~~~~~~~~~~~~~~~~~~

    Person api for OpenSlides

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.utils.person.signals import receive_persons
from openslides.utils.person.api import (
    generate_person_id, get_person, Person, Persons)
from openslides.utils.person.forms import PersonFormField, MultiplePersonFormField
from openslides.utils.person.models import PersonField, PersonMixin

__all__ = ['receive_persons', 'generate_person_id', 'get_person', 'Person',
           'Persons', 'PersonFormField', 'MultiplePersonFormField',
           'PersonField', 'PersonMixin', 'EmptyPerson']


class EmptyPerson(PersonMixin, Person):
    @property
    def person_id(self):
        return 'empty'
