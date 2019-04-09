import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.core.models import ChatMessage, Projector, Tag
from openslides.users.models import User
from openslides.utils.autoupdate import inform_changed_data
from openslides.utils.test import TestCase
from tests.common_groups import GROUP_ADMIN_PK, GROUP_DELEGATE_PK

from ..helpers import count_queries


@pytest.mark.django_db(transaction=False)
def test_projector_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all projectors,
    * 1 request to get the list of the projector defaults.
    """
    for index in range(10):
        Projector.objects.create(name=f"Projector{index}")

    assert count_queries(Projector.get_elements) == 2


@pytest.mark.django_db(transaction=False)
def test_chat_message_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all chatmessages.
    """
    user = User.objects.get(username="admin")
    for index in range(10):
        ChatMessage.objects.create(user=user)

    assert count_queries(ChatMessage.get_elements) == 1


@pytest.mark.django_db(transaction=False)
def test_tag_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all tags.
    """
    for index in range(10):
        Tag.objects.create(name=f"tag{index}")

    assert count_queries(Tag.get_elements) == 1


@pytest.mark.django_db(transaction=False)
def test_config_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all config values
    """
    config.save_default_values()

    assert count_queries(Tag.get_elements) == 1


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
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.projector = Projector.objects.get(pk=1)
        self.assertEqual(self.projector.elements, elements)
        self.assertEqual(self.projector.elements_preview, [])
        self.assertEqual(self.projector.elements_history, [])

    def test_add_element_without_name(self):
        response = self.client.post(
            reverse("projector-project", args=[self.projector.pk]),
            {"elements": [{}]},
            format="json",
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
            reverse("projector-project", args=[self.projector.pk]), {}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_remove_element(self):
        self.projector.elements = [{"name": "core/clock"}]
        self.projector.save()
        response = self.client.post(
            reverse("projector-project", args=[self.projector.pk]),
            {"elements": []},
            format="json",
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
            format="json",
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
            format="json",
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
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.projector = Projector.objects.get(pk=1)
        self.assertEqual(self.projector.elements, [])
        self.assertEqual(self.projector.elements_preview, elements)
        self.assertEqual(self.projector.elements_history, [])


class ChatMessageViewSet(TestCase):
    """
    Tests requests to deal with chat messages.
    """

    def setUp(self):
        admin = User.objects.get(username="admin")
        self.client.force_login(admin)
        ChatMessage.objects.create(
            message="test_message_peechiel8IeZoohaem9e", user=admin
        )

    def test_clear_chat(self):
        response = self.client.post(reverse("chatmessage-clear"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ChatMessage.objects.all().count(), 0)
