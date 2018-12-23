from openslides.utils.exceptions import OpenSlidesError


class TagException(OpenSlidesError):
    pass


class ConfigError(OpenSlidesError):
    pass


class ConfigNotFound(ConfigError):
    pass
