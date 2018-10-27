from collections import OrderedDict
from operator import attrgetter
from typing import Any, Dict, List

from django.apps import AppConfig
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db.models.signals import post_migrate
from django.db.utils import OperationalError

from ..utils.projector import register_projector_elements


class CoreAppConfig(AppConfig):
    name = 'openslides.core'
    verbose_name = 'OpenSlides Core'
    angular_site_module = True
    angular_projector_module = True

    def ready(self):
        # Import all required stuff.
        from .config import config
        from ..utils.rest_api import router
        from ..utils.cache import element_cache
        from .projector import get_projector_elements
        from .signals import (
            delete_django_app_permissions,
            get_permission_change_data,
            permission_change,
            post_permission_creation,
            required_users,
            user_data_required,
        )
        from .views import (
            ChatMessageViewSet,
            ConfigViewSet,
            CountdownViewSet,
            ProjectorMessageViewSet,
            ProjectorViewSet,
            TagViewSet,
        )
        from ..utils.constants import set_constants, get_constants_from_apps
        from .websocket import (
            NotifyWebsocketClientMessage,
            ConstantsWebsocketClientMessage,
            GetElementsWebsocketClientMessage,
            AutoupdateWebsocketClientMessage,
        )
        from ..utils.websocket import register_client_message

        # Collect all config variables before getting the constants.
        config.collect_config_variables_from_apps()

        # Set constants
        try:
            set_constants(get_constants_from_apps())
        except (ImproperlyConfigured, OperationalError):
            # Database is not loaded. This happens in tests and migrations.
            pass

        # Define projector elements.
        register_projector_elements(get_projector_elements())

        # Connect signals.
        post_permission_creation.connect(
            delete_django_app_permissions,
            dispatch_uid='delete_django_app_permissions')
        permission_change.connect(
            get_permission_change_data,
            dispatch_uid='core_get_permission_change_data')
        user_data_required.connect(
            required_users,
            dispatch_uid='core_required_users')

        post_migrate.connect(call_save_default_values, sender=self, dispatch_uid='core_save_config_default_values')

        # Register viewsets.
        router.register(self.get_model('Projector').get_collection_string(), ProjectorViewSet)
        router.register(self.get_model('ChatMessage').get_collection_string(), ChatMessageViewSet)
        router.register(self.get_model('Tag').get_collection_string(), TagViewSet)
        router.register(self.get_model('ConfigStore').get_collection_string(), ConfigViewSet, 'config')
        router.register(self.get_model('ProjectorMessage').get_collection_string(), ProjectorMessageViewSet)
        router.register(self.get_model('Countdown').get_collection_string(), CountdownViewSet)

        # Sets the cache
        try:
            element_cache.ensure_cache()
        except (ImproperlyConfigured, OperationalError):
            # This happens in the tests or in migrations. Do nothing
            pass

        # Register client messages
        register_client_message(NotifyWebsocketClientMessage())
        register_client_message(ConstantsWebsocketClientMessage())
        register_client_message(GetElementsWebsocketClientMessage())
        register_client_message(AutoupdateWebsocketClientMessage())

    def get_config_variables(self):
        from .config_variables import get_config_variables
        return get_config_variables()

    def get_startup_elements(self):
        """
        Yields all Cachables required on startup i. e. opening the websocket
        connection.
        """
        for model_name in ('Projector', 'ChatMessage', 'Tag', 'ProjectorMessage', 'Countdown', 'ConfigStore'):
            yield self.get_model(model_name)

    def get_angular_constants(self):
        from .config import config

        constants: Dict[str, Any] = {}

        # Client settings
        client_settings_keys = [
            'MOTION_IDENTIFIER_MIN_DIGITS',
            'MOTION_IDENTIFIER_WITHOUT_BLANKS',
            'MOTIONS_ALLOW_AMENDMENTS_OF_AMENDMENTS'
        ]
        client_settings_dict = {}
        for key in client_settings_keys:
            try:
                client_settings_dict[key] = getattr(settings, key)
            except AttributeError:
                # Settings key does not exist. Do nothing. The client will
                # treat this as undefined.
                pass
        constants['OpenSlidesSettings'] = client_settings_dict

        # Config variables
        config_groups: List[Any] = []
        for config_variable in sorted(config.config_variables.values(), key=attrgetter('weight')):
            if config_variable.is_hidden():
                # Skip hidden config variables. Do not even check groups and subgroups.
                continue
            if not config_groups or config_groups[-1]['name'] != config_variable.group:
                # Add new group.
                config_groups.append(OrderedDict(
                    name=config_variable.group,
                    subgroups=[]))
            if not config_groups[-1]['subgroups'] or config_groups[-1]['subgroups'][-1]['name'] != config_variable.subgroup:
                # Add new subgroup.
                config_groups[-1]['subgroups'].append(OrderedDict(
                    name=config_variable.subgroup,
                    items=[]))
            # Add the config variable to the current group and subgroup.
            config_groups[-1]['subgroups'][-1]['items'].append(config_variable.data)
        constants['OpenSlidesConfigVariables'] = config_groups

        return constants


def call_save_default_values(**kwargs):
    from .config import config
    config.save_default_values()
