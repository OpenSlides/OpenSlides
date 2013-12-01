# -*- coding: utf-8 -*-

from django.contrib import messages
from django.core.urlresolvers import reverse
from django.shortcuts import redirect
from django.utils.translation import ugettext as _

from openslides.config.api import config
from openslides.mediafile.models import Mediafile
from openslides.utils.tornado_webserver import ProjectorSocketHandler
from openslides.utils.template import Tab
from openslides.utils.views import (AjaxMixin, CreateView, DeleteView,
                                    RedirectView, TemplateView, UpdateView)
from openslides.utils.widgets import Widget

from .api import (call_on_projector, get_active_slide,
                  get_overlays, get_projector_content, get_projector_overlays,
                  get_projector_overlays_js, reset_countdown, set_active_slide,
                  start_countdown, stop_countdown, update_projector_overlay)
from .forms import SelectWidgetsForm
from .models import ProjectorSlide


class DashboardView(AjaxMixin, TemplateView):
    """
    Overview over all possible slides, the overlays and a live view.
    """
    template_name = 'projector/dashboard.html'
    permission_required = 'projector.can_see_dashboard'

    def get_context_data(self, **kwargs):
        context = super(DashboardView, self).get_context_data(**kwargs)
        widgets = []
        for widget in Widget.get_all(self.request):
            if widget.is_active():
                widgets.append(widget)
                context['extra_stylefiles'].extend(widget.get_stylesheets())
                context['extra_javascript'].extend(widget.get_javascript_files())
        context['widgets'] = widgets
        return context


class ProjectorView(TemplateView):
    """
    The Projector-Page.
    """
    permission_required = 'projector.can_see_projector'
    template_name = 'projector.html'

    def get_context_data(self, **kwargs):
        callback = self.kwargs.get('callback', None)

        if callback is None:
            kwargs.update({
                'content':  get_projector_content(),
                'overlays': get_projector_overlays(),
                'overlay_js': get_projector_overlays_js(as_json=True),
                'reload': True,
                'calls': config['projector_js_cache']})
        # For the Preview
        else:
            slide_dict = dict(self.request.GET.items())
            slide_dict['callback'] = callback
            kwargs.update({
                'content': get_projector_content(slide_dict),
                'reload': False})

        return super(ProjectorView, self).get_context_data(**kwargs)


class ActivateView(RedirectView):
    """
    Activate a Slide.
    """
    permission_required = 'projector.can_manage_projector'
    url_name = 'dashboard'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        if (kwargs['callback'] == 'mediafile' and
                get_active_slide()['callback'] == 'mediafile'):
            # If the current slide is a pdf and the new page is also a slide,
            # we dont have to use set_active_slide, because is causes a content
            # reload.
            kwargs.update({'page_num': 1, 'pk': request.GET.get('pk')})
            url = Mediafile.objects.get(pk=kwargs['pk'], is_presentable=True).mediafile.url
            config['projector_active_slide'] = kwargs
            ProjectorSocketHandler.send_updates(
                {'calls': {'load_pdf': {'url': url, 'page_num': kwargs['page_num']}}})
        else:
            set_active_slide(kwargs['callback'], **dict(request.GET.items()))
        config['projector_scroll'] = config.get_default('projector_scroll')
        config['projector_scale'] = config.get_default('projector_scale')
        call_on_projector({'scroll': config['projector_scroll'],
                           'scale': config['projector_scale']})


class SelectWidgetsView(TemplateView):
    """
    Show a Form to Select the widgets.
    """
    permission_required = 'projector.can_see_dashboard'
    template_name = 'projector/select_widgets.html'

    def get_context_data(self, **kwargs):
        context = super(SelectWidgetsView, self).get_context_data(**kwargs)

        widgets = Widget.get_all(self.request)
        for widget in widgets:
            initial = {'widget': widget.is_active()}
            prefix = widget.name
            if self.request.method == 'POST':
                widget.form = SelectWidgetsForm(self.request.POST, prefix=prefix,
                                                initial=initial)
            else:
                widget.form = SelectWidgetsForm(prefix=prefix, initial=initial)
        context['widgets'] = widgets
        return context

    def post(self, request, *args, **kwargs):
        """
        Activates or deactivates the widgets in a post request.
        """
        context = self.get_context_data(**kwargs)
        session_widgets = self.request.session.get('widgets', {})
        for widget in context['widgets']:
            if widget.form.is_valid():
                session_widgets[widget.name] = widget.form.cleaned_data['widget']
            else:
                messages.error(request, _('Errors in the form.'))
                break
        else:
            self.request.session['widgets'] = session_widgets
        return redirect(reverse('dashboard'))


class ProjectorControllView(RedirectView):
    """
    Scale or scroll the projector.
    """
    permission_required = 'projector.can_manage_projector'
    url_name = 'dashboard'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        direction = kwargs['direction']
        if direction == 'bigger':
            config['projector_scale'] = int(config['projector_scale']) + 1
        elif direction == 'smaller':
            config['projector_scale'] = int(config['projector_scale']) - 1
        elif direction == 'down':
            config['projector_scroll'] = int(config['projector_scroll']) + 1
        elif direction == 'up':
            if config['projector_scroll'] > 0:
                config['projector_scroll'] = int(config['projector_scroll']) - 1
        elif direction == 'clean_scale':
            config['projector_scale'] = config.get_default('projector_scale')
        elif direction == 'clean_scroll':
            config['projector_scroll'] = config.get_default('projector_scroll')

        call_on_projector({'scroll': config['projector_scroll'],
                           'scale': config['projector_scale']})

    def get_ajax_context(self, **kwargs):
        return {
            'scale_level': config['projector_scale'],
            'scroll_level': config['projector_scroll'],
        }


class CountdownControllView(RedirectView):
    """
    Start, stop or reset the countdown.
    """
    permission_required = 'projector.can_manage_projector'
    url_name = 'dashboard'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        command = kwargs['command']
        if command == 'reset':
            reset_countdown()
        elif command == 'start':
            start_countdown()
        elif command == 'stop':
            stop_countdown()
        elif command == 'set-default':
            try:
                config['countdown_time'] = \
                    int(self.request.GET['countdown_time'])
            except (ValueError, AttributeError):
                pass
            else:
                reset_countdown()
        update_projector_overlay('projector_countdown')

    def get_ajax_context(self, **kwargs):
        return {
            'state': config['countdown_state'],
            'countdown_time': config['countdown_time'],
        }


class OverlayMessageView(RedirectView):
    """
    Sets or clears the overlay message
    """
    url_name = 'dashboard'
    allow_ajax = True
    permission_required = 'projector.can_manage_projector'

    def pre_post_redirect(self, request, *args, **kwargs):
        if 'message' in request.POST:
            config['projector_message'] = request.POST['message_text']
        elif 'message-clean' in request.POST:
            config['projector_message'] = ''
        update_projector_overlay('projector_message')

    def get_ajax_context(self, **kwargs):
        return {
            'overlay_message': config['projector_message'],
        }


class ActivateOverlay(RedirectView):
    """
    Activate or deactivate an overlay.
    """
    url_name = 'dashboard'
    allow_ajax = True
    permission_required = 'projector.can_manage_projector'

    def pre_redirect(self, request, *args, **kwargs):
        overlay = get_overlays()[kwargs['name']]
        self.name = overlay.name
        if kwargs['activate']:
            if not overlay.is_active():
                overlay.set_active(True)
                update_projector_overlay(overlay)
            self.active = True
        else:
            if overlay.is_active():
                overlay.set_active(False)
                update_projector_overlay(overlay)
            self.active = False

    def get_ajax_context(self, **kwargs):
        return {'active': self.active, 'name': self.name}


class CustomSlideCreateView(CreateView):
    """
    Create a custom slide.
    """
    permission_required = 'agenda.can_manage_agenda'
    template_name = 'projector/new.html'
    model = ProjectorSlide
    context_object_name = 'customslide'
    success_url_name = 'dashboard'
    url_name_args = []


class CustomSlideUpdateView(UpdateView):
    """
    Update a custom slide.
    """
    permission_required = 'projector.can_manage_projector'
    template_name = 'projector/new.html'
    model = ProjectorSlide
    context_object_name = 'customslide'
    success_url_name = 'dashboard'
    url_name_args = []


class CustomSlideDeleteView(DeleteView):
    """
    Delete a custom slide.
    """
    permission_required = 'projector.can_manage_projector'
    model = ProjectorSlide
    success_url_name = 'dashboard'


def register_tab(request):
    """
    Register the projector tab.
    """
    selected = request.path.startswith('/projector/')
    return Tab(
        title=_('Dashboard'),
        app='dashboard',
        url=reverse('dashboard'),
        permission=request.user.has_perm('projector.can_see_dashboard'),
        selected=selected,
    )
