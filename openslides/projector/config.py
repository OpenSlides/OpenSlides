# -*- coding: utf-8 -*-

from openslides.config.api import ConfigPage, ConfigVariable


def get_projector_config_page(sender, **kwargs):
    """
    Projector config variables for OpenSlides. They are not shown on a
    config page.
    """
    # The active slide. The config-value is a dictonary with at least the entry
    # 'callback'.
    projector = ConfigVariable(
        name='projector_active_slide',
        default_value={'callback': None})

    projector_message = ConfigVariable(
        name='projector_message',
        default_value='')

    countdown_time = ConfigVariable(
        name='countdown_time',
        default_value=60)

    countdown_start_stamp = ConfigVariable(
        name='countdown_start_stamp',
        default_value=0)

    countdown_pause_stamp = ConfigVariable(
        name='countdown_pause_stamp',
        default_value=0)

    countdown_state = ConfigVariable(
        name='countdown_state',
        default_value='inactive')

    projector_scale = ConfigVariable(
        name='projector_scale',
        default_value=0)

    projector_scroll = ConfigVariable(
        name='projector_scroll',
        default_value=0)

    projector_js_cache = ConfigVariable(
        name='projector_js_cache',
        default_value={})

    projector_active_overlays = ConfigVariable(
        name='projector_active_overlays',
        default_value=[])

    projector_pdf_fullscreen = ConfigVariable(
        name='pdf_fullscreen',
        default_value=False)

    return ConfigPage(
        title='No title here', url='no-url-here', required_permission=None, variables=(
            projector, projector_message,
            countdown_time, countdown_start_stamp, countdown_pause_stamp,
            countdown_state, projector_scale, projector_scroll,
            projector_active_overlays, projector_js_cache,
            projector_pdf_fullscreen))
