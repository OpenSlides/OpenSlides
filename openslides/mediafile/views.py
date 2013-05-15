#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.mediafile.views
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Views for the mediafile app.

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _

from openslides.utils.template import Tab
from openslides.utils.views import ListView, CreateView, UpdateView, DeleteView

from .models import Mediafile
from .forms import MediafileNormalUserCreateForm, MediafileUpdateForm


class MediafileListView(ListView):
    """
    View to see a table of all uploaded files.
    """
    model = Mediafile

    def has_permission(self, request, *args, **kwargs):
        return (request.user.has_perm('mediafile.can_see') or
                request.user.has_perm('mediafile.can_upload') or
                request.user.has_perm('mediafile.can_manage'))


class MediafileCreateView(CreateView):
    """
    View to upload a new file. A manager can also set the uploader, else
    the request user is set as uploader.
    """
    model = Mediafile
    permission_required = 'mediafile.can_upload'
    success_url_name = 'mediafile_list'

    def get_form(self, form_class):
        form_kwargs = self.get_form_kwargs()
        if self.request.method == 'GET':
            form_kwargs['initial'].update({'uploader': self.request.user.person_id})
        if not self.request.user.has_perm('mediafile.can_manage'):
            # Returns our own ModelForm from .forms
            return MediafileNormalUserCreateForm(**form_kwargs)
        else:
            # Returns a ModelForm created by Django.
            return form_class(**form_kwargs)

    def manipulate_object(self, *args, **kwargs):
        """
        Method to handle the uploader. If a user has manager permissions,
        he has to set the uploader in the given form field. Then this
        method only calls super. Else it sets the requesting user as uploader.
        """
        if not self.request.user.has_perm('mediafile.can_manage'):
            self.object.uploader = self.request.user
        return super(MediafileCreateView, self).manipulate_object(*args, **kwargs)


class MediafileUpdateView(UpdateView):
    """
    View to edit the entry of an uploaded file.
    """
    model = Mediafile
    permission_required = 'mediafile.can_manage'
    form_class = MediafileUpdateForm
    success_url_name = 'mediafile_list'

    def get_form_kwargs(self, *args, **kwargs):
        form_kwargs = super(MediafileUpdateView, self).get_form_kwargs(*args, **kwargs)
        form_kwargs['initial'].update({'uploader': self.object.uploader.person_id})
        return form_kwargs


class MediafileDeleteView(DeleteView):
    """
    View to delete the entry of an uploaded file and the file itself.
    """
    model = Mediafile
    permission_required = 'mediafile.can_manage'
    success_url_name = 'mediafile_list'

    def case_yes(self, *args, **kwargs):
        """Deletes the file in the filesystem, if user clicks "Yes"."""
        self.object.mediafile.delete()
        return super(MediafileDeleteView, self).case_yes(*args, **kwargs)


def register_tab(request):
    """
    Inserts a new Tab to the views for files.
    """
    selected = request.path.startswith('/mediafile/')
    return Tab(
        title=_('Files'),
        app='mediafile',  # TODO: Rename this to icon='mediafile' later
        stylefile='styles/mediafile.css',
        url=reverse('mediafile_list'),
        permission=(request.user.has_perm('mediafile.can_see') or
                    request.user.has_perm('mediafile.can_upload') or
                    request.user.has_perm('mediafile.can_manage')),
        selected=selected)
