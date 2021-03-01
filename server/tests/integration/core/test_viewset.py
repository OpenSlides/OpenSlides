import random
import string

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.core.models import Projector, Tag
from openslides.users.models import User
from openslides.utils.auth import get_group_model
from openslides.utils.autoupdate import inform_changed_data
from tests.common_groups import GROUP_ADMIN_PK, GROUP_DELEGATE_PK
from tests.count_queries import count_queries
from tests.test_case import TestCase


@pytest.mark.django_db(transaction=False)
def test_projector_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all projectors,
    * 1 request to get the list of the projector defaults.
    """
    for index in range(10):
        Projector.objects.create(name=f"Projector{index}")

    assert count_queries(Projector.get_elements)() == 2


@pytest.mark.django_db(transaction=False)
def test_tag_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all tags.
    """
    for index in range(10):
        Tag.objects.create(name=f"tag{index}")

    assert count_queries(Tag.get_elements)() == 1


@pytest.mark.django_db(transaction=False)
def test_config_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all config values
    """
    config.save_default_values()

    assert count_queries(Tag.get_elements)() == 1


class ProjectorViewSet(TestCase):
    """
    Tests (currently just parts) of the ProjectorViewSet.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

    def test_create(self):
        response = self.client.post(
            reverse("projector-list"), {"name": "test_name_efIOLJHF32f&EF)NG3fw"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # pk=1 should be the default projector and pk=2 the new one
        self.assertEqual(Projector.objects.all().count(), 2)
        self.assertTrue(Projector.objects.filter(pk=2).exists())
        projector = Projector.objects.get(pk=2)
        self.assertEqual(projector.name, "test_name_efIOLJHF32f&EF)NG3fw")
        self.assertEqual(projector.elements, [{"name": "core/clock", "stable": True}])

    def test_create_no_data(self):
        response = self.client.post(reverse("projector-list"))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Projector.objects.all().count(), 1)

    def test_no_permission(self):
        admin = User.objects.get(username="admin")
        admin.groups.add(GROUP_DELEGATE_PK)
        admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(admin)

        response = self.client.post(reverse("projector-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Projector.objects.all().count(), 1)


class Projection(TestCase):
    """
    Tests the projection view.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.projector = Projector.objects.get(pk=1)  # the default projector

    def test_add_element(self):
        elements = [{"name": "core/clock"}]
        response = self.client.post(
            reverse("projector-project", args=[self.projector.pk]),
            {"elements": elements},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.projector = Projector.objects.get(pk=1)
        self.assertEqual(self.projector.elements, elements)
        self.assertEqual(self.projector.elements_preview, [])
        self.assertEqual(self.projector.elements_history, [])

    def test_add_element_without_name(self):
        response = self.client.post(
            reverse("projector-project", args=[self.projector.pk]), {"elements": [{}]}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.projector = Projector.objects.get(pk=1)
        self.assertEqual(self.projector.elements, [])
        self.assertEqual(self.projector.elements_preview, [])
        self.assertEqual(self.projector.elements_history, [])

    def test_no_permissions(self):
        admin = User.objects.get(username="admin")
        admin.groups.add(GROUP_DELEGATE_PK)
        admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(admin)

        response = self.client.post(
            reverse("projector-project", args=[self.projector.pk]), {}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_remove_element(self):
        self.projector.elements = [{"name": "core/clock"}]
        self.projector.save()
        response = self.client.post(
            reverse("projector-project", args=[self.projector.pk]), {"elements": []}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.projector = Projector.objects.get(pk=1)
        self.assertEqual(self.projector.elements, [])
        self.assertEqual(self.projector.elements_preview, [])
        self.assertEqual(self.projector.elements_history, [])

    def test_add_element_to_history(self):
        element = [{"name": "core/clock"}]
        response = self.client.post(
            reverse("projector-project", args=[self.projector.pk]),
            {"append_to_history": element},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.projector = Projector.objects.get(pk=1)
        self.assertEqual(self.projector.elements, [])
        self.assertEqual(self.projector.elements_preview, [])
        self.assertEqual(self.projector.elements_history, [element])

    def test_remove_last_history_element(self):
        element1 = [{"name": "core/clock"}]
        element2 = [{"name": "motions/motion"}]
        self.projector.elements_history = [element1, element2]
        self.projector.save()
        response = self.client.post(
            reverse("projector-project", args=[self.projector.pk]),
            {"delete_last_history_element": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.projector = Projector.objects.get(pk=1)
        self.assertEqual(self.projector.elements, [])
        self.assertEqual(self.projector.elements_preview, [])
        self.assertEqual(self.projector.elements_history, [element1])

    def test_set_preview(self):
        elements = [{"name": "core/clock"}]
        response = self.client.post(
            reverse("projector-project", args=[self.projector.pk]),
            {"preview": elements},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.projector = Projector.objects.get(pk=1)
        self.assertEqual(self.projector.elements, [])
        self.assertEqual(self.projector.elements_preview, elements)
        self.assertEqual(self.projector.elements_history, [])


class ConfigViewSet(TestCase):
    """
    Tests (currently just parts) of the ProjectorViewSet.
    """

    string_config_key = "general_event_name"
    """
    The config used for testing. It should accept string.
    """
    logo_config_key = "logo_web_header"

    html_config_key = "general_event_welcome_text"

    def random_string(self):
        return "".join(
            random.choice(string.ascii_letters + string.digits) for i in range(20)
        )

    def get_static_config_value(self):
        return {
            "path": f"test_path_{self.random_string()}",
            "display_name": f"test_display_name_{self.random_string()}",
        }

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

    def test_create(self):
        response = self.client.post(
            reverse("config-list"), {"key": "test_key_fj3f2oqsjcqpsjclqwoO"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(config.exists("test_key_fj3f2oqsjcqpsjclqwoO"))

    def test_delete(self):
        response = self.client.delete(
            reverse("config-detail", args=[self.string_config_key])
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(config.exists(self.string_config_key))

    def test_update(self):
        response = self.client.put(
            reverse("config-detail", args=[self.string_config_key]),
            {"value": "test_name_39gw4cishcvev2acoqnw"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            config[self.string_config_key], "test_name_39gw4cishcvev2acoqnw"
        )

    def test_validate_html(self):
        response = self.client.put(
            reverse("config-detail", args=[self.html_config_key]),
            {"value": "<p><foo>bar</foo></p>"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            config[self.html_config_key], "<p>&lt;foo&gt;bar&lt;/foo&gt;</p>"
        )

    def test_set_none(self):
        """
        The agenda_start_event_date_time is of type "datepicker" which
        can be set to None
        """
        response = self.client.put(
            reverse("config-detail", args=["agenda_start_event_date_time"]),
            {"value": None},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(config["agenda_start_event_date_time"], None)

    def test_set_invalid_none(self):
        """
        Try to set motions_identifier_min_digits to None, which should fail
        """
        response = self.client.put(
            reverse("config-detail", args=["motions_identifier_min_digits"]),
            {"value": None},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def degrade_admin(self, can_manage_config=False, can_manage_logos_and_fonts=False):
        admin = get_user_model().objects.get(username="admin")
        admin.groups.remove(GROUP_ADMIN_PK)
        admin.groups.add(GROUP_DELEGATE_PK)
        if can_manage_config or can_manage_logos_and_fonts:
            delegate_group = get_group_model().objects.get(pk=GROUP_DELEGATE_PK)
            if can_manage_config:
                delegate_group.permissions.add(
                    Permission.objects.get(
                        content_type__app_label="core", codename="can_manage_config"
                    )
                )
            if can_manage_logos_and_fonts:
                delegate_group.permissions.add(
                    Permission.objects.get(
                        content_type__app_label="core",
                        codename="can_manage_logos_and_fonts",
                    )
                )
            inform_changed_data(delegate_group)
        inform_changed_data(admin)

    def test_update_no_permissions(self):
        self.degrade_admin()
        response = self.client.put(
            reverse("config-detail", args=[self.string_config_key]),
            {"value": "test_name_vp2sjjf29jswlvwaxwre"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(config[self.string_config_key], "OpenSlides")

    def test_update_logo_no_config_permissions(self):
        self.degrade_admin(can_manage_logos_and_fonts=True)
        value = self.get_static_config_value()
        response = self.client.put(
            reverse("config-detail", args=[self.logo_config_key]), {"value": value}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(config[self.logo_config_key], value)

    def test_bulk_update(self):
        string_value = "test_value_k2jqvjwrorepjadvpo2J"
        logo_value = self.get_static_config_value()
        response = self.client.post(
            reverse("config-bulk-update"),
            [
                {"key": self.string_config_key, "value": string_value},
                {"key": self.logo_config_key, "value": logo_value},
            ],
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["errors"], {})
        self.assertEqual(config[self.string_config_key], string_value)
        self.assertEqual(config[self.logo_config_key], logo_value)

    def test_bulk_update_no_perm(self):
        self.degrade_admin()
        string_value = "test_value_gjscneuqoscmqf2qow91"
        response = self.client.post(
            reverse("config-bulk-update"),
            [{"key": self.string_config_key, "value": string_value}],
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(config[self.string_config_key], "OpenSlides")

    def test_bulk_update_no_list(self):
        string_value = "test_value_fjewqpqayqfijnqm%cqi"
        response = self.client.post(
            reverse("config-bulk-update"),
            {"key": self.string_config_key, "value": string_value},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(config[self.string_config_key], "OpenSlides")

    def test_bulk_update_no_key(self):
        string_value = "test_value_glwe32qc&Lml2lclmqmc"
        response = self.client.post(
            reverse("config-bulk-update"), [{"value": string_value}]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(config[self.string_config_key], "OpenSlides")

    def test_bulk_update_no_value(self):
        response = self.client.post(
            reverse("config-bulk-update"), [{"key": self.string_config_key}]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(config[self.string_config_key], "OpenSlides")

    def test_reset_group(self):
        config["general_event_name"] = "test_name_of20w2fj20clqwcm2pij"  # Group General
        config["agenda_show_subtitle"] = False  # Group Agenda
        config[
            "motions_preamble"
        ] = "test_preamble_2390jvwohjwo1oigefoq"  # Group motions
        response = self.client.post(
            reverse("config-reset-groups"), ["General", "Agenda"]
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(config["general_event_name"], "OpenSlides")
        self.assertEqual(config["agenda_show_subtitle"], True)
        self.assertEqual(
            config["motions_preamble"], "test_preamble_2390jvwohjwo1oigefoq"
        )

    def test_reset_group_wrong_format_1(self):
        response = self.client.post(reverse("config-reset-groups"), {"wrong": "format"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_group_wrong_format_2(self):
        response = self.client.post(
            reverse("config-reset-groups"), ["some_string", {"wrong": "format"}]
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
