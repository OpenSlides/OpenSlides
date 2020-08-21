from contextlib import contextmanager

from ..core.config import config
from .models import Mediafile


@contextmanager
def watch_and_update_configs():
    """
    Watches each font and logo config for changes. If some mediafiles were updated
    (also their parents, so some path changes) or were deleted, all affected configs
    are updated.
    """
    # 1) map logo and font config keys to mediafile ids
    mediafiles = Mediafile.objects.get_prefetched_queryset().all()
    logos = build_mapping("logos_available", mediafiles)
    fonts = build_mapping("fonts_available", mediafiles)
    yield
    # 2) update changed paths/urls
    mediafiles = Mediafile.objects.get_prefetched_queryset().all()
    update_mapping(logos, mediafiles)
    update_mapping(fonts, mediafiles)


def build_mapping(base_config_key, mediafiles):
    """ Returns a map of config keys to medaifile ids """
    logos = {}
    for key in config[base_config_key]:
        url = config[key]["path"]

        for mediafile in mediafiles:
            if mediafile.url == url:
                logos[key] = mediafile.id
                break
    return logos


def update_mapping(mapping, mediafiles):
    """
    Tries to get the mediafile from the id for a specific config field.
    If the file was found and the path changed, the config is updated. If the
    mediafile cound not be found, the config is cleared (mediafile deleted).
    """
    for key, id in mapping.items():
        try:
            mediafile = mediafiles.filter(pk=id)[0]
            print(config[key]["path"], mediafile.url)
            if config[key]["path"] != mediafile.url:
                config[key] = {
                    "display_name": config[key]["display_name"],
                    "path": mediafile.url,
                }
        except IndexError:
            config[key] = {"display_name": config[key]["display_name"], "path": ""}
