from typing import Any

from ..utils.projector import projector_slides
from ..utils.rest_api import Field, IntegerField, ModelSerializer, ValidationError
from ..utils.validate import validate_html
from .models import (
    ChatMessage,
    ConfigStore,
    Countdown,
    History,
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
                {"detail": f"Unknown projector element {element['name']},"}
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

    elements = JSONSerializerField(validators=[elements_validator])
    elements_preview = JSONSerializerField(validators=[elements_validator])
    elements_history = JSONSerializerField(validators=[elements_array_validator])

    projectiondefaults = ProjectionDefaultSerializer(many=True, read_only=True)
    width = IntegerField(min_value=800, max_value=3840, required=False)
    height = IntegerField(min_value=340, max_value=2880, required=False)

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
            "projectiondefaults",
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


class ChatMessageSerializer(ModelSerializer):
    """
    Serializer for core.models.ChatMessage objects.
    """

    class Meta:
        model = ChatMessage
        fields = ("id", "message", "timestamp", "user")
        read_only_fields = ("user",)


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
        fields = ("id", "description", "default_time", "countdown_time", "running")


class HistorySerializer(ModelSerializer):
    """
    Serializer for core.models.Countdown objects.

    Does not contain full data of history object.
    """

    information = JSONSerializerField()

    class Meta:
        model = History
        fields = ("id", "element_id", "now", "information", "restricted", "user")
        read_only_fields = ("now",)
