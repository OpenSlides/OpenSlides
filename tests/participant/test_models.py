#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for models of openslides.participant
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.utils.test import TestCase
from openslides.participant.models import Group


class DefaultGroups(TestCase):

    def test_pks_of_default_groups(self):
        default_groups = ((1, 'Anonymous'),
                          (2, 'Registered'),
                          (3, 'Delegates'),
                          (4, 'Staff'))
        for pk, name in default_groups:
            self.assertEquals(Group.objects.get(pk=pk).name, name)

    def test_default_perms_anonymous(self):
        anonymous = Group.objects.get(pk=1)
        default_perms = ('projector.can_see_projector',
                         'projector.can_see_dashboard',
                         'agenda.can_see_agenda',
                         'agenda.can_see_orga_items',
                         'motion.can_see_motion',
                         'assignment.can_see_assignment',
                         'participant.can_see_participant',
                         'mediafile.can_see')
        for perm_string in default_perms:
            perm_string_list = []
            for perm in anonymous.permissions.all():
                perm_string_list.append('%s.%s' % (perm.content_type.app_label, perm.codename))
            self.assertTrue(perm_string in perm_string_list)
