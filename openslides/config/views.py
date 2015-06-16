from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404

from openslides.utils.rest_api import Response, ValidationError, ViewSet

from .api import config
from .exceptions import ConfigNotFound


class ConfigViewSet(ViewSet):
    """
    API endpoint to list, retrieve and update the config.
    """
    def list(self, request):
        """
        Lists all config variables. Everybody can see them.
        """
        # TODO: Check if we need permission check here.
        data = ({'key': key, 'value': value} for key, value in config.items())
        return Response(data)

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieves one config variable. Everybody can see it.
        """
        # TODO: Check if we need permission check here.
        key = kwargs['pk']
        try:
            data = {'key': key, 'value': config[key]}
        except ConfigNotFound:
            raise Http404
        return Response(data)

    def update(self, request, *args, **kwargs):
        """
        Updates one config variable. Only managers can do this.

        Example: {"value": 42}
        """
        # Check permission.
        if not request.user.has_perm('config.can_manage'):
            self.permission_denied(request)

        # Check if pk is a valid config variable key.
        key = kwargs['pk']
        if key not in config:
            raise Http404

        # Validate value.
        form_field = config.get_config_variables()[key].form_field
        value = request.data['value']
        if form_field:
            try:
                form_field.clean(value)
            except DjangoValidationError as e:
                raise ValidationError({'detail': e.messages[0]})

        # Change value.
        config[key] = value

        # Return response.
        return Response({'key': key, 'value': value})
