#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.mediafile.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the mediafile app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _

from openslides.utils.template import Tab
from openslides.utils.views import ListView, CreateView, UpdateView, DeleteView

from .models import Mediafile
from .forms import MediafileUpdateForm


class MediafileListView(ListView):
    """
    View to see a table of all uploaded files.
    """
    model = Mediafile

    def has_permission(self, request, *args, **kwargs):
        return request.user.has_perm('mediafile.can_see') \
            or request.user.has_perm('mediafile.can_upload') \
            or request.user.has_perm('mediafile.can_manage')


class MediafileCreateView(CreateView):
    """
    View to upload a new file.
    """
    model = Mediafile
    permission_required = 'mediafile.can_upload'
    success_url_name = 'mediafile_list'


class MediafileUpdateView(UpdateView):
    """
    View to edit the entry of an uploaded file.
    """
    model = Mediafile
    permission_required = 'mediafile.can_manage'
    form_class = MediafileUpdateForm
    success_url_name = 'mediafile_list'


class MediafileDeleteView(DeleteView):
    """
    View to delete the entry of an uploaded file and the file itself.
    """
    model = Mediafile
    permission_required = 'mediafile.can_manage'
    success_url_name = 'mediafile_list'

    def case_yes(self):
        """
        Deletes the file in the filesystem, if user clicks "Yes".
        """
        self.object.mediafile.delete()
        super(MediafileDeleteView, self).case_yes()


def register_tab(request):
    """
    Inserts a new Tab to the views for files.
    """
    selected = request.path.startswith('/mediafile/')
    return Tab(
        title=_('Media'),
        url=reverse('mediafile_list'),
        permission=(request.user.has_perm('mediafile.can_see') or
                    request.user.has_perm('mediafile.can_upload') or
                    request.user.has_perm('mediafile.can_manage')),
        selected=selected,)
