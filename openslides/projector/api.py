# -*- coding: utf-8 -*-

from json import dumps
from time import time

from django.template.loader import render_to_string

from openslides.config.api import config
from openslides.utils.tornado_webserver import ProjectorSocketHandler
from openslides.utils.exceptions import OpenSlidesError

from .signals import projector_overlays

slide_callback = {}
"""
A dictonary where the key is the name of a slide, and the value is a
callable object which returns the html code for a slide.
"""

slide_model = {}
"""
A dictonary for SlideMixin models to reference from the slide_callback_name to
the Model
"""
# TODO: Find a bether way to do this. Maybe by reimplementing slides with
#       metaclasses


class SlideError(OpenSlidesError):
    pass


def update_projector():
    """
    Sends the data to the clients, who listen to the projector.
    """
    # TODO: only send necessary html
    ProjectorSocketHandler.send_updates({'content': get_projector_content()})


def update_projector_overlay(overlay):
    """
    Update one or all overlay on the projector.

    Checks if the overlay is activated and updates it in this case.

    The argument 'overlay' has to be an overlay object, the name of a
    ovleray or None. If it is None, all overlays will be updated.
    """
    if overlay is None:
        overlays = [item for item in get_overlays().values()]
    elif isinstance(overlay, basestring):
        overlays = [get_overlays()[overlay]]
    else:
        overlays = [overlay]

    overlay_dict = {}
    for overlay in overlays:
        if overlay.is_active():
            overlay_dict[overlay.name] = {
                'html': overlay.get_projector_html(),
                'javascript': overlay.get_javascript()}
        else:
            overlay_dict[overlay.name] = None
    ProjectorSocketHandler.send_updates({'overlays': overlay_dict})


def call_on_projector(calls):
    """
    Sends data to the projector.

    The argument call has to be a dictionary with the javascript function name
    as key and the argument for it as value.
    """
    projector_js_cache = config['projector_js_cache']
    projector_js_cache.update(calls)
    config['projector_js_cache'] = projector_js_cache
    ProjectorSocketHandler.send_updates({'calls': calls})


def get_projector_content(slide_dict=None):
    """
    Returns the HTML-Content block for the projector.

    Slide_dict has to be an dictonary with the key 'callback'.

    If slide_dict is None, use the active slide from the database.
    """
    if slide_dict is None:
        slide_dict = config['projector_active_slide'].copy()
    callback = slide_dict.pop('callback', None)

    try:
        slide_content = slide_callback[callback](**slide_dict)
    except (KeyError, SlideError):
        slide_content = default_slide()
    return slide_content


def default_slide():
    """
    Returns the HTML Code for the default slide.
    """
    return render_to_string('projector/default_slide.html')


def get_overlays(only_active=False):
    """
    Returns all overlay objects.

    If only_active is True, returns only active overlays.

    The returned value is a dictonary with the name of the overlay as key, and
    the overlay object as value.
    """
    overlays = {}
    for receiver, overlay in projector_overlays.send(sender='get_overlays'):
        if not only_active or overlay.is_active():
            overlays[overlay.name] = overlay
    return overlays


def get_projector_overlays_js(as_json=False):
    """
    Returns JS-Code for the active overlays.

    The retuned value is a list of json objects.
    """
    javascript = []
    for overlay in get_overlays().values():
        if overlay.is_active():
            overlay_js = overlay.get_javascript()
            if overlay_js:
                if as_json:
                    overlay_js = dumps(overlay_js)
                javascript.append(overlay_js)
    return javascript


def register_slide(name, callback, model=None):
    """
    Registers a function as slide callback.

    The optional argument 'model' is used to register a SlideModelClass.
    """
    slide_callback[name] = callback
    if model is not None:
        slide_model[name] = model


def register_slide_model(SlideModel, template):
    """
    Shortcut for register_slide for a Model with the SlideMixin.

    The Argument 'SlideModel' has to be a Django-Model-Class, which is a subclass
    of SlideMixin. Template has to be a string to the path of a template.
    """

    def model_slide(**kwargs):
        """
        Return the html code for the model slide.
        """
        slide_pk = kwargs.get('pk', None)

        try:
            slide = SlideModel.objects.get(pk=slide_pk)
        except SlideModel.DoesNotExist:
            raise SlideError
        else:
            context = slide.get_slide_context()

        return render_to_string(template, context)

    register_slide(SlideModel.slide_callback_name, model_slide, SlideModel)


def set_active_slide(callback, **kwargs):
    """
    Set the active Slide.

    callback: The name of the slide callback.
    kwargs: Keyword arguments for the slide callback.
    """
    kwargs.update(callback=callback)
    config['projector_active_slide'] = kwargs
    update_projector()
    update_projector_overlay(None)


def get_active_slide():
    """
    Returns the dictonary, which defines the active slide.
    """
    return config['projector_active_slide']


def get_active_object():
    """
    Returns an object if the active slide is an instance of SlideMixin.
    In other case, returns None
    """
    active_slide_dict = get_active_slide()
    callback_name = active_slide_dict.get('callback', None)
    object_pk = active_slide_dict.get('pk', None)
    try:
        Model = slide_model[callback_name]
    except KeyError:
        value = None
    else:
        try:
            value = Model.objects.get(pk=object_pk)
        except Model.DoesNotExist:
            value = None
    return value


def start_countdown():
    """
    Starts the countdown
    """
    # if we had stopped the countdown resume were we left of
    if config['countdown_state'] == 'paused':
        start_stamp = config['countdown_start_stamp']
        pause_stamp = config['countdown_pause_stamp']
        now = time()
        config['countdown_start_stamp'] = now - \
            (pause_stamp - start_stamp)
    else:
        config['countdown_start_stamp'] = time()

    config['countdown_state'] = 'active'
    config['countdown_pause_stamp'] = 0


def stop_countdown():
    """
    Stops the countdown
    """
    if config['countdown_state'] == 'active':
        config['countdown_state'] = 'paused'
        config['countdown_pause_stamp'] = time()


def reset_countdown():
    """
    Resets the countdown
    """
    config['countdown_start_stamp'] = time()
    config['countdown_pause_stamp'] = 0
    config['countdown_state'] = 'inactive'
