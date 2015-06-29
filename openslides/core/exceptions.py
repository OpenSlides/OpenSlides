from openslides.utils.exceptions import OpenSlidesError


class ProjectorException(OpenSlidesError):
    pass


class TagException(OpenSlidesError):
    pass


class ConfigError(OpenSlidesError):
    pass


class ConfigNotFound(ConfigError):
    pass
