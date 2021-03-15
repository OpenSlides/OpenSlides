import json

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides import __license__ as license, __url__ as url, __version__ as version
from openslides.core.config import ConfigVariable, config
from openslides.core.models import Projector
from openslides.utils.rest_api import ValidationError
from tests.test_case import TestCase


@pytest.mark.django_db(transaction=False)
def test_invalid_element_non_existing_slide(client):
    client.login(username="admin", password="admin")

    response = client.put(
        reverse("projector-detail", args=["1"]),
        {"elements": [{"name": "invalid_slide_name", "id": 1}]},
        content_type="application/json",
    )

    assert response.status_code == 400


@pytest.mark.django_db(transaction=False)
def test_invalid_element_no_name_attribute(client):
    client.login(username="admin", password="admin")

    response = client.put(
        reverse("projector-detail", args=["1"]),
        {"elements": [{"id": 1}]},
        content_type="application/json",
    )

    assert response.status_code == 400


@pytest.mark.django_db(transaction=False)
def test_invalid_element_not_a_inner_dict(client):
    client.login(username="admin", password="admin")

    response = client.put(
        reverse("projector-detail", args=["1"]),
        {"elements": ["not a dict"]},
        content_type="application/json",
    )

    assert response.status_code == 400


@pytest.mark.django_db(transaction=False)
def test_invalid_element_a_list(client):
    client.login(username="admin", password="admin")

    response = client.put(
        reverse("projector-detail", args=["1"]),
        {"elements": {"name": "invalid_slide_name", "id": 1}},
        content_type="application/json",
    )

    assert response.status_code == 400


@pytest.mark.django_db(transaction=False)
def test_project_view(client):
    client.login(username="admin", password="admin")
    projector = Projector.objects.get(pk=1)
    projector.elements_history = [[{"name": "topics/topic", "id": 3}]]
    projector.save()

    response = client.post(
        reverse("projector-project", args=["1"]),
        {
            "append_to_history": [{"name": "topics/topic", "id": 1}],
            "elements": [{"name": "topics/topic", "id": 2}],
            "preview": [{"name": "topics/topic", "id": 3}],
        },
        content_type="application/json",
    )

    projector.refresh_from_db()
    assert response.status_code == 200
    assert projector.elements == [{"name": "topics/topic", "id": 2}]
    assert projector.elements_history == [
        [{"name": "topics/topic", "id": 3}],
        [{"name": "topics/topic", "id": 1}],
    ]
    assert projector.elements_preview == [{"name": "topics/topic", "id": 3}]


@pytest.mark.django_db(transaction=False)
def test_set_reference_projector(client):
    client.login(username="admin", password="admin")
    Projector.objects.create(name="test_name_rePaODETymV4eFM3aOBD")
    reference_projector = Projector.objects.create(
        name="test_name_S2vXmumTMKyT4yjgEoyF"
    )

    response = client.post(
        reverse("projector-set-reference-projector", args=[reference_projector.pk])
    )
    assert response.status_code == 200

    for projector in Projector.objects.all():
        assert projector.reference_projector_id == reference_projector.id


@pytest.mark.django_db(transaction=False)
def test_get(client):
    client.login(username="admin", password="admin")
    response = client.get(reverse("core_version"))
    values = json.loads(response.content.decode())
    assert values["openslides_version"] == version
    assert values["openslides_license"] == license
    assert values["openslides_url"] == url


class ConfigViewSet(TestCase):
    """
    Tests requests to deal with config variables.
    """

    def setUp(self):
        # Save the old value of the config object and add the test values
        # TODO: Can be changed to setUpClass when Django 1.8 is no longer supported
        self._config_values = config.config_variables.copy()
        config.key_to_id = None
        config.update_config_variables(set_simple_config_view_integration_config_test())
        config.save_default_values()

    def tearDown(self):
        # Reset the config variables
        config.config_variables = self._config_values
        super().tearDown()

    def test_update(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        response = self.client.put(
            reverse("config-detail", args=["test_var_Xeiizi7ooH8Thuk5aida"]),
            {"value": "test_value_Phohx3oopeichaiTheiw"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            config["test_var_Xeiizi7ooH8Thuk5aida"], "test_value_Phohx3oopeichaiTheiw"
        )

    def test_update_wrong_datatype(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        response = self.client.put(
            reverse("config-detail", args=["test_var_ohhii4iavoh5Phoh5ahg"]),
            {"value": "test_value_string"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"detail": "Wrong datatype. Expected <class 'int'>, got <class 'str'>."},
        )

    def test_update_wrong_datatype_that_can_be_converted(self):
        """
        Try to send a string that can be converted to an integer to an integer
        field.
        """
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        response = self.client.put(
            reverse("config-detail", args=["test_var_ohhii4iavoh5Phoh5ahg"]),
            {"value": "12345"},
        )
        self.assertEqual(response.status_code, 200)

    def test_update_good_choice(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        response = self.client.put(
            reverse("config-detail", args=["test_var_wei0Rei9ahzooSohK1ph"]),
            {"value": "key_2_yahb2ain1aeZ1lea1Pei"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            config["test_var_wei0Rei9ahzooSohK1ph"], "key_2_yahb2ain1aeZ1lea1Pei"
        )

    def test_update_bad_choice(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        response = self.client.put(
            reverse("config-detail", args=["test_var_wei0Rei9ahzooSohK1ph"]),
            {"value": "test_value_bad_string"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data, {"detail": "Invalid input. Choice does not match."}
        )

    def test_update_validator_ok(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        response = self.client.put(
            reverse("config-detail", args=["test_var_Hi7Oje8Oith7goopeeng"]),
            {"value": "valid_string"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(config["test_var_Hi7Oje8Oith7goopeeng"], "valid_string")

    def test_update_validator_invalid(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        response = self.client.put(
            reverse("config-detail", args=["test_var_Hi7Oje8Oith7goopeeng"]),
            {"value": "invalid_string"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {"detail": "Invalid input."})

    def test_update_only_with_key(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        response = self.client.put(
            reverse("config-detail", args=["test_var_Xeiizi7ooH8Thuk5aida"])
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data, {"detail": "Got None for test_var_Xeiizi7ooH8Thuk5aida"}
        )


def validator_for_testing(value):
    """
    Validator for testing.
    """
    if value == "invalid_string":
        raise ValidationError({"detail": "Invalid input."})


def set_simple_config_view_integration_config_test():
    """
    Sets a simple config view with some config variables but without
    grouping.
    """
    yield ConfigVariable(
        name="test_var_aeW3Quahkah1phahCheo",
        default_value=None,
        label="test_label_aeNahsheu8phahk8taYo",
    )

    yield ConfigVariable(name="test_var_Xeiizi7ooH8Thuk5aida", default_value="")

    yield ConfigVariable(
        name="test_var_ohhii4iavoh5Phoh5ahg", default_value=0, input_type="integer"
    )

    yield ConfigVariable(
        name="test_var_wei0Rei9ahzooSohK1ph",
        default_value="key_1_Queit2juchoocos2Vugh",
        input_type="choice",
        choices=(
            {
                "value": "key_1_Queit2juchoocos2Vugh",
                "display_name": "label_1_Queit2juchoocos2Vugh",
            },
            {
                "value": "key_2_yahb2ain1aeZ1lea1Pei",
                "display_name": "label_2_yahb2ain1aeZ1lea1Pei",
            },
        ),
    )

    yield ConfigVariable(
        name="test_var_Hi7Oje8Oith7goopeeng",
        default_value="",
        validators=(validator_for_testing,),
    )

    yield ConfigVariable(
        name="test_var_pud2zah2teeNaiP7IoNa",
        default_value=None,
        label="test_label_xaing7eefaePheePhei6",
        hidden=True,
    )
