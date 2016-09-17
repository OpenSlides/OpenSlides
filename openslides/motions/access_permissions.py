import json

from jsonschema import ValidationError, validate

from ..core.config import config
from ..utils.access_permissions import BaseAccessPermissions


class MotionAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Motion and MotionViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('motions.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import MotionSerializer

        return MotionSerializer

    def get_restricted_data(self, full_data, user):
        """
        Returns the restricted serialized data for the instance prepared for
        the user. Removes non public comment fields for some unauthorized
        users.
        """
        if user.has_perm('motions.can_see_and_manage_comments') or not full_data.get('comments'):
            data = full_data
        else:
            data = full_data.copy()
            for i, field in enumerate(self.get_comments_config_fields()):
                if not field.get('public'):
                    try:
                        data['comments'][i] = None
                    except IndexError:
                        # No data in range. Just do nothing.
                        pass
        return data

    def get_projector_data(self, full_data):
        """
        Returns the restricted serialized data for the instance prepared
        for the projector. Removes several fields.
        """
        data = full_data.copy()
        for i, field in enumerate(self.get_comments_config_fields()):
            if not field.get('public'):
                try:
                    data['comments'][i] = None
                except IndexError:
                    # No data in range. Just do nothing.
                    pass
        return data

    def get_comments_config_fields(self):
        """
        Take input from config field and parse it. It can be some
        JSON or just a comma separated list of strings.

        The result is an array of objects. Each object contains
        at least the name of the comment field See configSchema.

        Attention: This code does also exist on server side.
        """
        configSchema = {
            "$schema": "http://json-schema.org/draft-04/schema#",
            "title": "Motion Comments",
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "minLength": 1
                    },
                    "public": {
                        "type": "boolean"
                    },
                    "forRecommendation": {
                        "type": "boolean"
                    },
                    "forState": {
                        "type": "boolean"
                    }
                },
                "required": ["name"]
            },
            "minItems": 1,
            "uniqueItems": True
        }
        configValue = config['motions_comments']
        fields = None
        isJSON = True
        try:
            fields = json.loads(configValue)
        except ValueError:
            isJSON = False
        if isJSON:
            # Config is JSON. Validate it.
            try:
                validate(fields, configSchema)
            except ValidationError:
                fields = []
        else:
            # Config is a comma separated list of strings. Strip out
            # empty parts. All valid strings lead to public comment
            # fields.
            fields = map(
                lambda name: {'name': name, 'public': True},
                filter(
                    lambda name: name,
                    configValue.split(',')
                )
            )
        return fields


class CategoryAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Category and CategoryViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('motions.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import CategorySerializer

        return CategorySerializer


class WorkflowAccessPermissions(BaseAccessPermissions):
    """
    Access permissions container for Workflow and WorkflowViewSet.
    """
    def check_permissions(self, user):
        """
        Returns True if the user has read access model instances.
        """
        return user.has_perm('motions.can_see')

    def get_serializer_class(self, user=None):
        """
        Returns serializer class.
        """
        from .serializers import WorkflowSerializer

        return WorkflowSerializer
