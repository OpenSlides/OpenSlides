#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.person.api
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Usefull functions for the OpenSlides person api.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from .signals import receive_persons


class Person(object):
    """
    Meta-class for all person objects
    """
    def person_id(self):
        """
        Return an id for representation of ths person. Has to be unique.
        """
        raise NotImplementedError('Any person object needs a person_id')

    def __repr__(self):
        """
        Return a string for this person.
        """
        return str(self.person_id)

    @property
    def sort_name(self):
        """
        Return the part of the name, which is used for sorting.
        For example the pre-name or the last-name
        """
        return self.clean_name.lower()

    @property
    def clean_name(self):
        """
        Return the name of this person without a suffix
        """
        return unicode(self)

    @property
    def name_suffix(self):
        """
        Return a suffix for the person-name.
        """
        return ''


class Persons(object):
    """
    A Storage for a multiplicity of different Person-Objects.
    """
    def __init__(self, person_prefix_filter=None, id_filter=None):
        self.person_prefix_filter = person_prefix_filter
        self.id_filter = id_filter

    def __iter__(self):
        try:
            return iter(self._cache)
        except AttributeError:
            return self.iter_persons()

    def __len__(self):
        return len(list(self.__iter__()))

    def __getitem__(self, key):
        try:
            return list(self)[key]
        except IndexError:
            from openslides.utils.person import EmptyPerson
            return EmptyPerson()

    def iter_persons(self):
        self._cache = list()
        for receiver, persons in receive_persons.send(
                sender='persons', person_prefix_filter=self.person_prefix_filter, id_filter=self.id_filter):
            for person in persons:
                self._cache.append(person)
                yield person


def generate_person_id(prefix, id):
    assert prefix is not None
    assert id is not None
    if ':' in prefix:
        raise ValueError("':' is not allowed in a the 'person_prefix'")
    return "%s:%d" % (prefix, id)


def split_person_id(person_id):
    data = person_id.split(':', 1)
    if len(data) == 2 and data[0] and data[1]:
        return data
    raise TypeError("Invalid person_id: '%s'" % person_id)


def get_person(person_id):
    try:
        person_prefix, id = split_person_id(person_id)
    except TypeError:
        from openslides.utils.person import EmptyPerson
        return EmptyPerson()
    return Persons(person_prefix_filter=person_prefix, id_filter=id)[0]
