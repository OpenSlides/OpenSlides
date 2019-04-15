import os
import sys
from collections import OrderedDict
from operator import attrgetter
from typing import Any, Dict, List, Set

from django.apps import AppConfig
from django.conf import settings
from django.db.models import Max
from django.db.models.signals import post_migrate, pre_delete


class CoreAppConfig(AppConfig):
    name = "openslides.core"
    verbose_name = "OpenSlides Core"
    angular_site_module = True

    def ready(self):
        # Import all required stuff.
        from .config import config
        from .projector import register_projector_slides
        from . import serializers  # noqa
        from .signals import (
            autoupdate_for_many_to_many_relations,
            delete_django_app_permissions,
            get_permission_change_data,
            permission_change,
            post_permission_creation,
        )
        from .views import (
            ChatMessageViewSet,
            ConfigViewSet,
            CountdownViewSet,
            HistoryViewSet,
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
        )
        from ..utils.access_permissions import required_user
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
        permission_change.connect(
            get_permission_change_data, dispatch_uid="core_get_permission_change_data"
        )

        post_migrate.connect(
            call_save_default_values,
            sender=self,
            dispatch_uid="core_save_config_default_values",
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
        router.register(
            self.get_model("ChatMessage").get_collection_string(), ChatMessageViewSet
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
        router.register(
            self.get_model("History").get_collection_string(), HistoryViewSet
        )

        if "runserver" in sys.argv or "changeconfig" in sys.argv:
            startup()

        # Register client messages
        register_client_message(NotifyWebsocketClientMessage())
        register_client_message(ConstantsWebsocketClientMessage())
        register_client_message(GetElementsWebsocketClientMessage())
        register_client_message(AutoupdateWebsocketClientMessage())
        register_client_message(ListenToProjectors())

        # register required_users
        required_user.add_collection_string(
            self.get_model("ChatMessage").get_collection_string(), required_users
        )

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
            "ChatMessage",
            "Tag",
            "ProjectorMessage",
            "Countdown",
            "ConfigStore",
            "History",
        ):
            yield self.get_model(model_name)

    def get_angular_constants(self):
        from .config import config

        constants: Dict[str, Any] = {}

        # Client settings
        client_settings_keys = [
            "MOTION_IDENTIFIER_MIN_DIGITS",
            "MOTION_IDENTIFIER_WITHOUT_BLANKS",
            "MOTIONS_ALLOW_AMENDMENTS_OF_AMENDMENTS",
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

        # get max migration id -> the "version" of the DB
        from django.db.migrations.recorder import MigrationRecorder

        constants["MigrationVersion"] = MigrationRecorder.Migration.objects.aggregate(
            Max("id")
        )["id__max"]

        return constants


def call_save_default_values(**kwargs):
    from .config import config

    config.save_default_values()


def required_users(element: Dict[str, Any]) -> Set[int]:
    """
    Returns all user ids that are displayed as chatters.
    """
    return set((element["user_id"],))


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

    set_constants(get_constants_from_apps())
    element_cache.ensure_cache()
    History.objects.build_history()
