from .config import config


class ConfigCacheMiddleware(object):
    """
    Middleware to refresh the config cache before processing any view.
    """
    def process_request(self, request):
        config.setup_cache()
