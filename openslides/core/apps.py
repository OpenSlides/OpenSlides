from collections import OrderedDict
from operator import attrgetter
from typing import Any, List  # noqa

from django.apps import AppConfig
from django.conf import settings
from django.db.models.signals import post_migrate

from ..utils.collection import Collection
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
        from .config_variables import get_config_variables
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

        # Define config variables and projector elements.
        config.update_config_variables(get_config_variables())
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

    def get_startup_elements(self):
        """
        Yields all collections required on startup i. e. opening the websocket
        connection.
        """
        for model in ('Projector', 'ChatMessage', 'Tag', 'ProjectorMessage', 'Countdown', 'ConfigStore'):
            yield Collection(self.get_model(model).get_collection_string())

    def get_angular_constants(self):
        from .config import config

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
        client_settings = {
            'name': 'OpenSlidesSettings',
            'value': client_settings_dict}

        # Config variables
        config_groups = []  # type: List[Any]  # TODO: Replace Any by correct type
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
        config_variables = {
            'name': 'OpenSlidesConfigVariables',
            'value': config_groups}

        # Send the privacy policy to the client. A user should view them, even he is
        # not logged in (so does not have the config values yet).
        privacy_policy = {
            'name': 'PrivacyPolicy',
            'value': config['general_event_privacy_policy']}

        return [client_settings, config_variables, privacy_policy]


def call_save_default_values(**kwargs):
    from .config import config
    config.save_default_values()
