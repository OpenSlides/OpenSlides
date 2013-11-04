# -*- coding: utf-8 -*-


class Tab(object):
    """
    Entry for the main menu of OpenSlides.
    """
    def __init__(self, title='', app='', stylefile='', url='', permission=True, selected=False):
        self.title = title
        self.app = app
        self.stylefile = stylefile
        self.url = url
        self.permission = permission
        self.selected = selected
