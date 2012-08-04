#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.user
    ~~~~~~~~~~~~~~~~~~~~~

    User api for OpenSlides

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.utils.user.signals import receiv_users
from openslides.utils.user.api import generate_uid, split_uid, get_user, Users
from openslides.utils.user.forms import UserFormField, MultipleUserFormField
from openslides.utils.user.models import UserField, UserMixin


class EmtyUser(UserMixin):
    @property
    def uid(self):
        return 'emtyuser'
