import jsonschema
import pytest

from openslides.utils.websocket import schema


def test_notify_schema_validation():
    # This raises a validaten error if it fails
    message = {
        "id": "test-message",
        "type": "notify",
        "content": {"name": "testname", "content": ["some content"]},
    }
    jsonschema.validate(message, schema)


def test_notify_schema_invalid_str_in_list():
    message = {
        "type": "notify",
        "content": [{}, "testmessage"],
        "id": "test_send_invalid_notify_str_in_list",
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(message, schema)


def test_notify_schema_invalid_no_elements():
    message = {
        "type": "notify",
        "content": [],
        "id": "test_send_invalid_notify_str_in_list",
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(message, schema)


def test_notify_schema_invalid_not_a_list():
    message = {
        "type": "notify",
        "content": {"testmessage": "foobar, what else."},
        "id": "test_send_invalid_notify_str_in_list",
    }
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(message, schema)
