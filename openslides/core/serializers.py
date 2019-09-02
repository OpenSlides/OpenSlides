from typing import Any

from ..utils.projector import projector_slides
from ..utils.rest_api import (
    Field,
    IdPrimaryKeyRelatedField,
    IntegerField,
    ModelSerializer,
    ValidationError,
)
from ..utils.validate import validate_html
from .models import (
    ConfigStore,
    Countdown,
    ProjectionDefault,
    Projector,
    ProjectorMessage,
    Tag,
)


class JSONSerializerField(Field):
    """
    Serializer for projector's and config JSONField.
    """

    def to_internal_value(self, data):
        """
        Returns the value. It is encoded from the Django JSONField.
        """
        return data

    def to_representation(self, value):
        """
        Returns the value. It is decoded from the Django JSONField.
        """
        return value


class ProjectionDefaultSerializer(ModelSerializer):
    """
    Serializer for core.models.ProjectionDefault objects.
    """

    class Meta:
        model = ProjectionDefault
        fields = ("id", "name", "display_name", "projector")


def elements_validator(value: Any) -> None:
    """
    Checks the format of the elements field.
    """
    if not isinstance(value, list):
        raise ValidationError({"detail": "Data must be a list."})
    for element in value:
        if not isinstance(element, dict):
            raise ValidationError({"detail": "Data must be a dictionary."})
        if element.get("name") is None:
            raise ValidationError(
                {"detail": "Every dictionary must have a key 'name'."}
            )
        if element["name"] not in projector_slides:
            raise ValidationError(
                {"detail": "Unknown projector element {0}.", "args": [element["name"]]}
            )


def elements_array_validator(value: Any) -> None:
    """
    Validates the value of the element field of the projector model.
    """
    if not isinstance(value, list):
        raise ValidationError({"detail": "Data must be a list."})
    for element in value:
        elements_validator(element)


class ProjectorSerializer(ModelSerializer):
    """
    Serializer for core.models.Projector objects.
    """

    elements = JSONSerializerField(read_only=True)
    elements_preview = JSONSerializerField(read_only=True)
    elements_history = JSONSerializerField(read_only=True)

    width = IntegerField(min_value=800, max_value=3840, required=False)
    height = IntegerField(min_value=340, max_value=2880, required=False)

    projectiondefaults = IdPrimaryKeyRelatedField(
        many=True, required=False, queryset=ProjectionDefault.objects.all()
    )

    class Meta:
        model = Projector
        fields = (
            "id",
            "elements",
            "elements_preview",
            "elements_history",
            "scale",
            "scroll",
            "name",
            "width",
            "height",
            "reference_projector",
            "projectiondefaults",
            "color",
            "background_color",
            "header_background_color",
            "header_font_color",
            "header_h1_color",
            "chyron_background_color",
            "chyron_font_color",
            "show_header_footer",
            "show_title",
            "show_logo",
        )
        read_only_fields = ("scale", "scroll")


class TagSerializer(ModelSerializer):
    """
    Serializer for core.models.Tag objects.
    """

    class Meta:
        model = Tag
        fields = ("id", "name")


class ConfigSerializer(ModelSerializer):
    """
    Serializer for core.models.Tag objects.
    """

    value = JSONSerializerField()

    class Meta:
        model = ConfigStore
        fields = ("id", "key", "value")


class ProjectorMessageSerializer(ModelSerializer):
    """
    Serializer for core.models.ProjectorMessage objects.
    """

    class Meta:
        model = ProjectorMessage
        fields = ("id", "message")

    def validate(self, data):
        if "message" in data:
            data["message"] = validate_html(data["message"])
        return data


class CountdownSerializer(ModelSerializer):
    """
    Serializer for core.models.Countdown objects.
    """

    class Meta:
        model = Countdown
        fields = (
            "id",
            "title",
            "description",
            "default_time",
            "countdown_time",
            "running",
        )
        unique_together = ("title",)
