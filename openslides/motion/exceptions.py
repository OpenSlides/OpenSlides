#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.motion.exceptions
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Exceptions for the motion app.

    :copyright: (c) 2011–2013 by the OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.utils.exceptions import OpenSlidesError


class MotionError(OpenSlidesError):
    """Exception raised when errors in the motion accure."""
    pass


class WorkflowError(OpenSlidesError):
    """Exception raised when errors in a workflow or state accure."""
    pass
