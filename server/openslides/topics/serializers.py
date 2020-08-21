from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.rest_api import CharField, IntegerField, ModelSerializer
from openslides.utils.validate import validate_html_permissive

from .models import Topic


class TopicSerializer(ModelSerializer):
    """
    Serializer for core.models.Topic objects.
    """

    agenda_type = IntegerField(
        write_only=True, required=False, min_value=1, max_value=3, allow_null=True
    )
    agenda_parent_id = IntegerField(write_only=True, required=False, min_value=1)
    agenda_comment = CharField(write_only=True, required=False, allow_blank=True)
    agenda_duration = IntegerField(write_only=True, required=False, min_value=1)
    agenda_weight = IntegerField(write_only=True, required=False, min_value=1)

    class Meta:
        model = Topic
        fields = (
            "id",
            "title",
            "text",
            "attachments",
            "agenda_item_id",
            "list_of_speakers_id",
            "agenda_type",
            "agenda_parent_id",
            "agenda_comment",
            "agenda_duration",
            "agenda_weight",
        )

    def validate(self, data):
        if "text" in data:
            data["text"] = validate_html_permissive(data["text"])
        return data

    def create(self, validated_data):
        """
        Customized create method. Set information about related agenda item
        into agenda_item_update_information container.
        """
        agenda_type = validated_data.pop("agenda_type", None)
        agenda_parent_id = validated_data.pop("agenda_parent_id", None)
        agenda_comment = validated_data.pop("agenda_comment", None)
        agenda_duration = validated_data.pop("agenda_duration", None)
        agenda_weight = validated_data.pop("agenda_weight", None)
        attachments = validated_data.pop("attachments", [])
        topic = Topic(**validated_data)
        topic.agenda_item_update_information["type"] = agenda_type
        topic.agenda_item_update_information["parent_id"] = agenda_parent_id
        topic.agenda_item_update_information["comment"] = agenda_comment
        topic.agenda_item_update_information["duration"] = agenda_duration
        topic.agenda_item_update_information["weight"] = agenda_weight
        topic.save(skip_autoupdate=True)
        topic.attachments.add(*attachments)
        inform_changed_data(topic)
        return topic
