#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.person.api
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Usefull functions for the OpenSlides person api.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.utils.person.signals import receiv_persons


class Persons(object):
    """
    A Storage for a multiplicity of different Person-Objects.
    """
    def __init__(self, person_prefix=None, id=None):
        self.person_prefix = person_prefix
        self.id = id

    def __iter__(self):
        try:
            return iter(self._cache)
        except AttributeError:
            return iter(self.iter_persons())

    def __len__(self):
        return len(list(self.__iter__()))

    def __getitem__(self, key):
        return list(self)[key]

    def iter_persons(self):
        self._cache = list()
        for receiver, persons in receiv_persons.send(
                sender='persons', person_prefix=self.person_prefix, id=self.id):
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
        from openslides.utils.person import EmtyPerson
        return EmtyPerson()
    return Persons(person_prefix=person_prefix, id=id)[0]
