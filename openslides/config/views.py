from collections import OrderedDict
from operator import attrgetter

from django.http import Http404

from openslides.utils.rest_api import (
    Response,
    SimpleMetadata,
    ValidationError,
    ViewSet,
)

from .api import config
from .exceptions import ConfigError, ConfigNotFound


class ConfigMetadata(SimpleMetadata):
    """
    Custom metadata class to add config info to responses on OPTIONS requests.
    """
    def determine_metadata(self, request, view):
        # Sort config variables by weight.
        config_variables = sorted(config.get_config_variables().values(), key=attrgetter('weight'))

        # Build tree.
        config_groups = []
        for config_variable in config_variables:
            if not config_groups or config_groups[-1]['name'] != config_variable.group:
                config_groups.append(OrderedDict(
                    name=config_variable.group,
                    subgroups=[]))
            if not config_groups[-1]['subgroups'] or config_groups[-1]['subgroups'][-1]['name'] != config_variable.subgroup:
                config_groups[-1]['subgroups'].append(OrderedDict(
                    name=config_variable.subgroup,
                    items=[]))
            config_groups[-1]['subgroups'][-1]['items'].append(config_variable.data)

        # Add tree to metadata.
        metadata = super().determine_metadata(request, view)
        metadata['config_groups'] = config_groups
        return metadata


class ConfigViewSet(ViewSet):
    """
    API endpoint to list, retrieve and update the config.
    """
    metadata_class = ConfigMetadata

    def list(self, request):
        """
        Lists all config variables. Everybody can see them.
        """
        return Response([{'key': key, 'value': value} for key, value in config.items()])

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieves a config variable. Everybody can see it.
        """
        key = kwargs['pk']
        try:
            value = config[key]
        except ConfigNotFound:
            raise Http404
        return Response({'key': key, 'value': value})

    def update(self, request, *args, **kwargs):
        """
        Updates a config variable. Only managers can do this.

        Example: {"value": 42}
        """
        # Check permission.
        if not request.user.has_perm('config.can_manage'):
            self.permission_denied(request)

        key = kwargs['pk']
        value = request.data['value']

        # Validate and change value.
        try:
            config[key] = value
        except ConfigNotFound:
            raise Http404
        except ConfigError as e:
            raise ValidationError({'detail': e})

        # Return response.
        return Response({'key': key, 'value': value})
