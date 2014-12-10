from django.apps import AppConfig


class AccountAppConfig(AppConfig):
    name = 'openslides.account'
    verbose_name = 'OpenSlides Account'

    def ready(self):
        # Load widget.
        from . import widgets  # noqa
