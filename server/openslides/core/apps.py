import sys
from typing import Any, Dict

from django.apps import AppConfig
from django.conf import settings
from django.db.models.signals import post_migrate, pre_delete

from openslides.utils import logging
from openslides.utils.schema_version import schema_version_handler


class CoreAppConfig(AppConfig):
    name = "openslides.core"
    verbose_name = "OpenSlides Core"

    def ready(self):
        # Import all required stuff.
        # Let all client websocket message register
        from ..utils import websocket_client_messages  # noqa
        from ..utils.rest_api import router
        from . import serializers  # noqa
        from .config import config
        from .projector import register_projector_slides
        from .signals import (
            autoupdate_for_many_to_many_relations,
            cleanup_unused_permissions,
            delete_django_app_permissions,
            get_permission_change_data,
            permission_change,
            post_permission_creation,
        )
        from .views import (
            ConfigViewSet,
            CountdownViewSet,
            ProjectionDefaultViewSet,
            ProjectorMessageViewSet,
            ProjectorViewSet,
            TagViewSet,
        )

        # Collect all config variables before getting the constants.
        config.collect_config_variables_from_apps()

        # Define projector elements.
        register_projector_slides()

        # Connect signals.
        post_permission_creation.connect(
            delete_django_app_permissions, dispatch_uid="delete_django_app_permissions"
        )
        post_permission_creation.connect(
            cleanup_unused_permissions, dispatch_uid="cleanup_unused_permissions"
        )
        permission_change.connect(
            get_permission_change_data, dispatch_uid="core_get_permission_change_data"
        )

        post_migrate.connect(
            manage_config, sender=self, dispatch_uid="core_manage_config"
        )
        pre_delete.connect(
            autoupdate_for_many_to_many_relations,
            dispatch_uid="core_autoupdate_for_many_to_many_relations",
        )

        # Register viewsets.
        router.register(
            self.get_model("Projector").get_collection_string(), ProjectorViewSet
        )
        router.register(
            self.get_model("Projectiondefault").get_collection_string(),
            ProjectionDefaultViewSet,
        )
        router.register(self.get_model("Tag").get_collection_string(), TagViewSet)
        router.register(
            self.get_model("ConfigStore").get_collection_string(),
            ConfigViewSet,
            "config",
        )
        router.register(
            self.get_model("ProjectorMessage").get_collection_string(),
            ProjectorMessageViewSet,
        )
        router.register(
            self.get_model("Countdown").get_collection_string(), CountdownViewSet
        )

        if "runserver" in sys.argv or "changeconfig" in sys.argv:
            from openslides.utils.startup import run_startup_hooks

            run_startup_hooks()

    def get_startup_hooks(self):
        from openslides.core.models import History
        from openslides.utils.cache import element_cache
        from openslides.utils.constants import set_constants_from_apps

        return {
            10: element_cache.ensure_schema_version,
            40: set_constants_from_apps,
            90: History.objects.build_history,
        }

    def get_config_variables(self):
        from .config_variables import get_config_variables

        return get_config_variables()

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        for model_name in (
            "Projector",
            "ProjectionDefault",
            "Tag",
            "ProjectorMessage",
            "Countdown",
            "ConfigStore",
        ):
            yield self.get_model(model_name)

    def get_angular_constants(self):
        constants: Dict[str, Any] = {}

        # Client settings
        client_settings_keys = [
            "PRIORITIZED_GROUP_IDS",
            "PING_INTERVAL",
            "PING_TIMEOUT",
            "ENABLE_ELECTRONIC_VOTING",
            "JITSI_DOMAIN",
            "JITSI_ROOM_NAME",
            "JITSI_ROOM_PASSWORD",
            "DEMO_USERS",
        ]
        client_settings_dict = {}
        for key in client_settings_keys:
            try:
                client_settings_dict[key] = getattr(settings, key)
            except AttributeError:
                # Settings key does not exist. Do nothing. The client will
                # treat this as undefined.
                pass
        constants["Settings"] = client_settings_dict

        constants["SchemaVersion"] = schema_version_handler.get()
        return constants


def manage_config(**kwargs):
    """
    Should be run after every migration. Saves default values
    of all non db-existing config objects into the db. Deletes all
    unnecessary old config values, e.g. all db entries, that does
    not have a config_variable anymore. Increments the config version,
    if at least one of the operations altered some data.
    """
    from .config import config

    altered = config.save_default_values()
    altered = config.cleanup_old_config_values() or altered
    if altered:
        config.increment_version()
        logging.getLogger(__name__).info("Updated config variables")
