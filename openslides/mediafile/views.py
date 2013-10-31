# -*- coding: utf-8 -*-

from django.core.urlresolvers import reverse
from django.http import HttpResponse
from django.utils.translation import ugettext as _

from openslides.config.api import config
from openslides.projector.api import get_active_slide
from openslides.projector.projector import Widget
from openslides.utils.template import Tab
from openslides.utils.tornado_webserver import ProjectorSocketHandler
from openslides.utils.views import (AjaxView, CreateView, DeleteView, RedirectView, ListView,
                                    UpdateView)

from .forms import MediafileNormalUserCreateForm, MediafileUpdateForm
from .models import Mediafile


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
    url_name_args = []

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
    url_name_args = []

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

    def on_clicked_yes(self, *args, **kwargs):
        """Deletes the file in the filesystem, if user clicks "Yes"."""
        self.object.mediafile.delete()
        return super(MediafileDeleteView, self).on_clicked_yes(*args, **kwargs)


class PdfNavBaseView(AjaxView):
    """
    BaseView for the Pdf Ajax Navigation.
    """

    def get_ajax_context(self, *args, **kwargs):
        return {'current_page': self.active_slide['page_num']}

    def load_other_page(self, active_slide):
        """
        Tell connected clients to load an other pdf page.
        """
        config['projector_active_slide'] = active_slide
        ProjectorSocketHandler.send_updates(
            {'calls': {'load_pdf_page': active_slide['page_num']}})


class PdfNextView(PdfNavBaseView):
    """
    Activate the next Page of a pdf and return the number of the current page.
    """

    def get(self, request, *args, **kwargs):
        """
        Increment the page number by 1.

        If the page number is set in the active slide, we are the value is
        incremented by 1. Otherwise, it is the first page and it is set to 2.
        """
        self.active_slide = get_active_slide()
        if self.active_slide['callback'] == 'mediafile':
            if 'page_num' not in self.active_slide:
                self.active_slide['page_num'] = 2
            else:
                self.active_slide['page_num'] += 1
            self.load_other_page(self.active_slide)
            response = super(PdfNextView, self).get(self, request, *args, **kwargs)
        else:
            # no Mediafile is active and the JavaScript should not do anything.
            response = HttpResponse()
        return response


class PdfPreviousView(PdfNavBaseView):
    """
    Activate the previous Page of a pdf and return the number of the current page.
    """

    def get(self, request, *args, **kwargs):
        """
        Decrement the page number by 1.

        If the page number is set and it is greater than 1, it is decremented
        by 1. Otherwise, it is the first page and nothing happens.
        """
        self.active_slide = get_active_slide()
        response = None
        if self.active_slide['callback'] == 'mediafile':
            if 'page_num' in self.active_slide and self.active_slide['page_num'] > 1:
                self.active_slide['page_num'] -= 1
                self.load_other_page(self.active_slide)
                response = super(PdfPreviousView, self).get(self, request, *args, **kwargs)
        if not response:
            response = HttpResponse()
        return response


class PdfGoToPageView(PdfNavBaseView):
    """
    Activate the page set in the textfield.
    """

    def get(self, request, *args, **kwargs):
        target_page = int(request.GET.get('page_num'))
        self.active_slide = get_active_slide()
        if target_page:
            self.active_slide['page_num'] = target_page
            self.load_other_page(self.active_slide)
            response = super(PdfGoToPageView, self).get(self, request, *args, **kwargs)
        else:
            response = HttpResponse()
        return response


class PdfToggleFullscreenView(RedirectView):
    """
    Toggle fullscreen mode for pdf presentations.
    """
    allow_ajax = True
    url_name = 'dashboard'

    def get_ajax_context(self, *args, **kwargs):
        config['pdf_fullscreen'] = not config['pdf_fullscreen']
        active_slide = get_active_slide()
        if active_slide['callback'] == 'mediafile':
            ProjectorSocketHandler.send_updates(
                {'calls': {'toggle_fullscreen': config['pdf_fullscreen']}})
        return {'fullscreen': config['pdf_fullscreen']}


def get_widgets(request):
    """
    Return the widgets of the projector app
    """
    widgets = []

    # PDF-Presentation widget
    pdfs = Mediafile.objects.filter(
        filetype__in=Mediafile.PRESENTABLE_FILE_TYPES,
        is_presentable=True
    )
    current_page = get_active_slide().get('page_num', 1)
    widgets.append(Widget(
        request,
        name='presentations',
        display_name=_('Presentations'),
        template='mediafile/pdfs_widget.html',
        context={'pdfs': pdfs, 'current_page': current_page,
                 'pdf_fullscreen': config['pdf_fullscreen']},
        permission_required='projector.can_manage_projector',
        default_column=1,
        default_weight=75))

    return widgets


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
