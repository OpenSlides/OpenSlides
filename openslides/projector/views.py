# -*- coding: utf-8 -*-

from openslides.config.api import config
from openslides.mediafile.models import Mediafile
from openslides.utils.tornado_webserver import ProjectorSocketHandler
from openslides.utils.views import RedirectView, TemplateView

from .api import (call_on_projector, get_active_slide,
                  get_overlays, get_projector_content,
                  get_projector_overlays_js, reset_countdown, set_active_slide,
                  start_countdown, stop_countdown, update_projector_overlay)


class ProjectorView(TemplateView):
    """
    The Projector-Page.
    """
    required_permission = 'core.can_see_projector'
    template_name = 'projector.html'

    def get_context_data(self, **kwargs):
        callback = self.kwargs.get('callback', None)

        if callback is None:
            kwargs.update({
                'content':  get_projector_content(),
                'overlays': get_overlays(only_active=True),
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
    required_permission = 'core.can_manage_projector'
    url_name = 'core_dashboard'
    allow_ajax = True

    def pre_redirect(self, request, *args, **kwargs):
        if (kwargs['callback'] == 'mediafile' and
                get_active_slide()['callback'] == 'mediafile'):
            # TODO: find a way to do this in the mediafile-app
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
        call_on_projector({'scroll': config['projector_scroll'],
                           'scale': config['projector_scale']})


class ProjectorControllView(RedirectView):
    """
    Scale or scroll the projector.
    """
    required_permission = 'core.can_manage_projector'
    url_name = 'core_dashboard'
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
    required_permission = 'core.can_manage_projector'
    url_name = 'core_dashboard'
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
    url_name = 'core_dashboard'
    allow_ajax = True
    required_permission = 'core.can_manage_projector'

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
    url_name = 'core_dashboard'
    allow_ajax = True
    required_permission = 'core.can_manage_projector'

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
