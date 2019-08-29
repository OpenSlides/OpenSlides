import os
import sys
from collections import OrderedDict
from operator import attrgetter
from typing import Any, Dict, List

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
        from .config import config
        from .projector import register_projector_slides
        from . import serializers  # noqa
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
            ProjectorMessageViewSet,
            ProjectorViewSet,
            ProjectionDefaultViewSet,
            TagViewSet,
        )
        from .websocket import (
            NotifyWebsocketClientMessage,
            ConstantsWebsocketClientMessage,
            GetElementsWebsocketClientMessage,
            AutoupdateWebsocketClientMessage,
            ListenToProjectors,
            PingPong,
        )
        from ..utils.rest_api import router
        from ..utils.websocket import register_client_message

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
            startup()

        # Register client messages
        register_client_message(NotifyWebsocketClientMessage())
        register_client_message(ConstantsWebsocketClientMessage())
        register_client_message(GetElementsWebsocketClientMessage())
        register_client_message(AutoupdateWebsocketClientMessage())
        register_client_message(ListenToProjectors())
        register_client_message(PingPong())

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
        from .config import config

        constants: Dict[str, Any] = {}

        # Client settings
        client_settings_keys = [
            "PRIORITIZED_GROUP_IDS",
            "PING_INTERVAL",
            "PING_TIMEOUT",
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

        # Config variables
        config_groups: List[Any] = []
        for config_variable in sorted(
            config.config_variables.values(), key=attrgetter("weight")
        ):
            if config_variable.is_hidden():
                # Skip hidden config variables. Do not even check groups and subgroups.
                continue
            if not config_groups or config_groups[-1]["name"] != config_variable.group:
                # Add new group.
                config_groups.append(
                    OrderedDict(name=config_variable.group, subgroups=[])
                )
            if (
                not config_groups[-1]["subgroups"]
                or config_groups[-1]["subgroups"][-1]["name"]
                != config_variable.subgroup
            ):
                # Add new subgroup.
                config_groups[-1]["subgroups"].append(
                    OrderedDict(name=config_variable.subgroup, items=[])
                )
            # Add the config variable to the current group and subgroup.
            config_groups[-1]["subgroups"][-1]["items"].append(config_variable.data)
        constants["ConfigVariables"] = config_groups

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


def startup():
    """
    Runs commands that are needed at startup.

    Sets the cache, constants and startup history
    """
    if os.environ.get("NO_STARTUP"):
        return

    from openslides.utils.constants import set_constants, get_constants_from_apps
    from openslides.utils.cache import element_cache
    from openslides.core.models import History

    element_cache.ensure_schema_version()
    set_constants(get_constants_from_apps())
    History.objects.build_history()
