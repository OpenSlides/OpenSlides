import pytest
from django.contrib.auth.models import Permission
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.users.models import Group, PersonalNote, User
from openslides.utils.autoupdate import inform_changed_data
from tests.count_queries import count_queries
from tests.test_case import TestCase

from ...common_groups import (
    GROUP_ADMIN_PK,
    GROUP_DEFAULT_PK,
    GROUP_DELEGATE_PK,
    GROUP_STAFF_PK,
)


@pytest.mark.django_db(transaction=False)
def test_user_db_queries():
    """
    Tests that only the following db queries are done:
    * 2 requests to get the list of all users and
    * 1 request to get all vote delegations
    * 1 request to get the list of all groups.
    """
    for index in range(10):
        User.objects.create(username=f"user{index}")

    assert count_queries(User.get_elements)() == 4


@pytest.mark.django_db(transaction=False)
def test_group_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 request to get the list of all groups.
    * 1 request to get the permissions
    """
    for index in range(10):
        Group.objects.create(name=f"group{index}")

    assert count_queries(Group.get_elements)() == 2


class UserCreate(TestCase):
    """
    Tests creation of users via REST API.
    """

    def test_simple_creation(self):
        response = self.client.post(
            reverse("user-list"), {"last_name": "Test name keimeiShieX4Aekoe3do"}
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(username="Test name keimeiShieX4Aekoe3do")
        self.assertEqual(response.data["id"], new_user.id)

    def test_creation_with_group(self):
        group_pks = (GROUP_DELEGATE_PK, GROUP_STAFF_PK)

        self.client.post(
            reverse("user-list"),
            {"last_name": "Test name aedah1iequoof0Ashed4", "groups_id": group_pks},
        )

        user = User.objects.get(username="Test name aedah1iequoof0Ashed4")
        self.assertTrue(user.groups.filter(pk=group_pks[0]).exists())
        self.assertTrue(user.groups.filter(pk=group_pks[1]).exists())

    def test_creation_with_default_group(self):
        group_pk = (GROUP_DEFAULT_PK,)

        response = self.client.post(
            reverse("user-list"),
            {"last_name": "Test name aedah1iequoof0Ashed4", "groups_id": group_pk},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {"groups_id": ['Invalid pk "%d" - object does not exist.' % group_pk]},
        )

    def test_clean_html(self):
        self.client.login(username="admin", password="admin")
        response = self.client.post(
            reverse("user-list"),
            {
                "username": "test_name_Thimoo2ho7ahreighio3",
                "about_me": "<p><foo>bar</foo></p>",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="test_name_Thimoo2ho7ahreighio3")
        self.assertEqual(user.about_me, "<p>&lt;foo&gt;bar&lt;/foo&gt;</p>")

    def test_double_username(self):
        for field in ("last_name", "username"):
            response = self.client.post(reverse("user-list"), {"username": "admin"})
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(User.objects.count(), 1)


class UserUpdate(TestCase):
    """
    Tests update of users via REST API.
    """

    def test_simple_update_via_patch(self):
        """
        Test to only update the last_name with a patch request.

        The field username *should not* be changed by the request.
        """
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        # This is the builtin user 'Administrator' with username 'admin'. The pk is valid.
        user_pk = User.objects.get(username="admin").pk

        response = admin_client.patch(
            reverse("user-detail", args=[user_pk]),
            {"last_name": "New name tu3ooh5Iez5Aec2laefo"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(pk=user_pk)
        self.assertEqual(user.last_name, "New name tu3ooh5Iez5Aec2laefo")
        self.assertEqual(user.username, "admin")

    def test_simple_update_via_put(self):
        """
        Test to only update the last_name with a put request.

        The field username *should* be changed by the request.
        """
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        # This is the builtin user 'Administrator'. The pk is valid.
        user_pk = User.objects.get(username="admin").pk

        response = admin_client.put(
            reverse("user-detail", args=[user_pk]), {"last_name": "New name Ohy4eeyei5"}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.get(pk=user_pk).username, "New name Ohy4eeyei5")

    def test_update_deactivate_yourselfself(self):
        """
        Tests that an user can not deactivate himself.
        """
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        # This is the builtin user 'Administrator'. The pk is valid.
        user_pk = User.objects.get(username="admin").pk

        response = admin_client.patch(
            reverse("user-detail", args=[user_pk]),
            {"username": "admin", "is_active": False},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_yourself_non_manager(self):
        """
        Tests that an user can update himself even if he is not a manager.
        """
        user = User.objects.create_user(
            username="non-admin zeiyeGhaoXoh4awe3xai",
            password="non-admin chah1hoshohN5Oh7zouj",
        )
        client = APIClient()
        client.login(
            username="non-admin zeiyeGhaoXoh4awe3xai",
            password="non-admin chah1hoshohN5Oh7zouj",
        )

        response = client.put(
            reverse("user-detail", args=[user.pk]),
            {
                "username": "New username IeWeipee5mahpi4quupo",
                "last_name": "New name fae1Bu1Eyeis9eRox4xu",
                "about_me": "New profile text Faemahphi3Hilokangei",
            },
        )

        self.assertEqual(response.status_code, 200)
        user = User.objects.get(pk=user.pk)
        self.assertEqual(user.username, "New username IeWeipee5mahpi4quupo")
        self.assertEqual(user.about_me, "New profile text Faemahphi3Hilokangei")
        # The user is not allowed to change some other fields (like last_name).
        self.assertNotEqual(user.last_name, "New name fae1Bu1Eyeis9eRox4xu")

    def test_update_vote_delegation(self):
        user = User.objects.create_user(
            username="non-admin Yd4ejrJXZi4Wn16ugHgY",
            password="non-admin AQ4Dw2tN9byKpGD4f1gs",
        )

        response = self.client.patch(
            reverse("user-detail", args=[user.pk]),
            {"vote_delegated_to_id": self.admin.pk},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(pk=user.pk)
        self.assertEqual(user.vote_delegated_to_id, self.admin.pk)
        admin = User.objects.get(username="admin")
        self.assertEqual(
            list(admin.vote_delegated_from_users.values_list("id", flat=True)),
            [user.pk],
        )

    def test_update_vote_delegation_same_user(self):
        user = User.objects.create_user(
            username="non-admin EVnE4n103fPZXcVV",
            password="non-admin 1WywRnqKbcdtQwS2",
            vote_delegated_to=self.admin,
        )

        response = self.client.patch(
            reverse("user-detail", args=[user.pk]),
            {"vote_delegated_to_id": self.admin.pk, "vote_delegated_from_users_id": []},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(pk=user.pk)
        self.assertEqual(user.vote_delegated_to_id, self.admin.pk)

    def test_update_remove_vote_delegation(self):
        user = User.objects.create_user(
            username="non-admin EVnE4n103fPZXcVV",
            password="non-admin 1WywRnqKbcdtQwS2",
            vote_delegated_to=self.admin,
        )

        response = self.client.patch(
            reverse("user-detail", args=[user.pk]),
            {"vote_delegated_to_id": None, "vote_delegated_from_users_id": []},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(pk=user.pk)
        self.assertEqual(user.vote_delegated_to_id, None)
        admin = User.objects.get(username="admin")
        self.assertEqual(admin.vote_delegated_from_users.count(), 0)

    def test_update_vote_delegation_non_admin(self):
        user = User.objects.create_user(
            username="non-admin WpBQRSsCg6qNWNtN6bLP",
            password="non-admin IzsDBt1uoqc2wo5BSUF1",
        )
        client = APIClient()
        client.login(
            username="non-admin WpBQRSsCg6qNWNtN6bLP",
            password="non-admin IzsDBt1uoqc2wo5BSUF1",
        )

        response = client.patch(
            reverse("user-detail", args=[user.pk]),
            {"vote_delegated_to_id": self.admin.pk},
        )

        # self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(pk=user.pk)
        self.assertIsNone(user.vote_delegated_to_id)

    def test_update_vote_delegated_to_self(self):
        response = self.client.patch(
            reverse("user-detail", args=[self.admin.pk]),
            {"vote_delegated_to_id": self.admin.pk},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        admin = User.objects.get(pk=self.admin.pk)
        self.assertIsNone(admin.vote_delegated_to_id)

    def test_update_vote_delegation_invalid_id(self):
        response = self.client.patch(
            reverse("user-detail", args=[self.admin.pk]),
            {"vote_delegated_to_id": 42},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        admin = User.objects.get(pk=self.admin.pk)
        self.assertIsNone(admin.vote_delegated_to_id)

    def test_update_vote_delegated_from_self(self):
        response = self.client.patch(
            reverse("user-detail", args=[self.admin.pk]),
            {"vote_delegated_from_users_id": [self.admin.pk]},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        admin = User.objects.get(pk=self.admin.pk)
        self.assertIsNone(admin.vote_delegated_to_id)

    def test_update_vote_delegated_from_invalid_id(self):
        response = self.client.patch(
            reverse("user-detail", args=[self.admin.pk]),
            {"vote_delegated_from_users_id": [1234]},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        admin = User.objects.get(pk=self.admin.pk)
        self.assertIsNone(admin.vote_delegated_to_id)

    def setup_vote_delegation(self):
        """ login and setup user -> user2 delegation """
        self.user, _ = self.create_user()
        self.user2, _ = self.create_user()
        self.user.vote_delegated_to = self.user2
        self.user.save()
        self.assertEqual(self.user.vote_delegated_to_id, self.user2.pk)

    def test_update_reset_vote_delegated_to(self):
        self.setup_vote_delegation()
        response = self.client.patch(
            reverse("user-detail", args=[self.user.pk]),
            {"vote_delegated_to_id": None},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(pk=self.user.pk)
        self.assertEqual(user.vote_delegated_to_id, None)

    def test_update_reset_vote_delegated_from(self):
        self.setup_vote_delegation()
        response = self.client.patch(
            reverse("user-detail", args=[self.user2.pk]),
            {"vote_delegated_from_users_id": []},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(pk=self.user.pk)
        self.assertEqual(user.vote_delegated_to_id, None)

    def test_update_no_reset_vote_delegated_from_on_none(self):
        self.setup_vote_delegation()
        response = self.client.patch(
            reverse("user-detail", args=[self.user2.pk]),
            {"vote_delegated_from_users_id": None},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(pk=self.user.pk)
        self.assertEqual(user.vote_delegated_to_id, self.user2.id)

    def test_update_nested_vote_delegation_1(self):
        """ user -> user2 -> admin """
        self.setup_vote_delegation()
        response = self.client.patch(
            reverse("user-detail", args=[self.user2.pk]),
            {"vote_delegated_to_id": self.admin.pk},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        user2 = User.objects.get(pk=self.user2.pk)
        self.assertIsNone(user2.vote_delegated_to_id)

    def test_update_nested_vote_delegation_2(self):
        """ admin -> user -> user2 """
        self.setup_vote_delegation()
        response = self.client.patch(
            reverse("user-detail", args=[self.admin.pk]),
            {"vote_delegated_to_id": self.user.pk},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        admin = User.objects.get(pk=self.admin.pk)
        self.assertIsNone(admin.vote_delegated_to_id)

    def test_update_vote_delegated_from(self):
        self.setup_vote_delegation()
        response = self.client.patch(
            reverse("user-detail", args=[self.user2.pk]),
            {"vote_delegated_from_users_id": [self.admin.pk]},
        )

        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        admin = User.objects.get(pk=self.admin.pk)
        self.assertEqual(admin.vote_delegated_to_id, self.user2.id)
        user = User.objects.get(pk=self.user.pk)
        self.assertIsNone(user.vote_delegated_to_id)

    def test_update_vote_delegated_from_nested_1(self):
        """ admin -> user -> user2 """
        self.setup_vote_delegation()
        response = self.client.patch(
            reverse("user-detail", args=[self.user.pk]),
            {"vote_delegated_from_users_id": [self.admin.pk]},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        admin = User.objects.get(pk=self.admin.pk)
        self.assertIsNone(admin.vote_delegated_to_id)

    def test_update_vote_delegated_from_nested_2(self):
        """ user -> user2 -> admin """
        self.setup_vote_delegation()
        response = self.client.patch(
            reverse("user-detail", args=[self.admin.pk]),
            {"vote_delegated_from_users_id": [self.user2.pk]},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        user2 = User.objects.get(pk=self.user2.pk)
        self.assertIsNone(user2.vote_delegated_to_id)

    def test_update_vote_delegation_both_1(self):
        """ Change user -> user2 to admin -> user in one request. """
        self.user2 = User.objects.create_user(
            username="user2",
            password="non-admin 1WywRnqKbcdtQwS2",
        )
        self.user = User.objects.create_user(
            username="user",
            password="non-admin 1WywRnqKbcdtQwS2",
            vote_delegated_to=self.user2,
        )
        response = self.client.patch(
            reverse("user-detail", args=[self.user.pk]),
            {
                "vote_delegated_to_id": None,
                "vote_delegated_from_users_id": [self.admin.pk],
            },
        )

        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        admin = User.objects.get(pk=self.admin.pk)
        self.assertEqual(admin.vote_delegated_to_id, self.user.id)
        user = User.objects.get(pk=self.user.pk)
        self.assertIsNone(user.vote_delegated_to_id)
        self.assertEqual(
            list(user.vote_delegated_from_users.values_list("id", flat=True)),
            [self.admin.pk],
        )
        user2 = User.objects.get(pk=self.user2.pk)
        self.assertEqual(user2.vote_delegated_from_users.count(), 0)

    def test_update_vote_delegation_both_2(self):
        """ Change user -> user2 to user2 -> admin in one request. """
        self.user2 = User.objects.create_user(
            username="user2",
            password="non-admin 1WywRnqKbcdtQwS2",
        )
        self.user = User.objects.create_user(
            username="user",
            password="non-admin 1WywRnqKbcdtQwS2",
            vote_delegated_to=self.user2,
        )
        response = self.client.patch(
            reverse("user-detail", args=[self.user2.pk]),
            {
                "vote_delegated_to_id": self.admin.pk,
                "vote_delegated_from_users_id": [],
            },
        )

        self.assertHttpStatusVerbose(response, status.HTTP_200_OK)
        admin = User.objects.get(pk=self.admin.pk)
        self.assertEqual(
            list(admin.vote_delegated_from_users.values_list("id", flat=True)),
            [self.user2.pk],
        )
        user = User.objects.get(pk=self.user.pk)
        self.assertIsNone(user.vote_delegated_to_id)
        user2 = User.objects.get(pk=self.user2.pk)
        self.assertEqual(user2.vote_delegated_to, self.admin)
        self.assertEqual(user2.vote_delegated_from_users.count(), 0)


class UserDelete(TestCase):
    """
    Tests delete of users via REST API.
    """

    def setUp(self):
        self.admin_client = APIClient()
        self.admin_client.login(username="admin", password="admin")

    def test_delete(self):
        User.objects.create(username="Test name bo3zieT3iefahng0ahqu")

        response = self.admin_client.delete(reverse("user-detail", args=["2"]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            User.objects.filter(username="Test name bo3zieT3iefahng0ahqu").exists()
        )

    def test_delete_yourself(self):
        # This is the builtin user 'Administrator'. The pk is valid.
        admin_user_pk = 1
        response = self.admin_client.delete(
            reverse("user-detail", args=[admin_user_pk])
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_delete(self):
        # create 10 users:
        ids = []
        for i in range(10):
            user = User(username=f"user_{i}")
            user.save()
            ids.append(user.id)

        response = self.admin_client.post(
            reverse("user-bulk-delete"), {"user_ids": ids}
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk__in=ids).exists())

    def test_bulk_delete_self(self):
        """ The own id should be excluded, so nothing should happen. """
        response = self.admin_client.post(
            reverse("user-bulk-delete"), {"user_ids": [1]}
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(User.objects.filter(pk=1).exists())


class UserPassword(TestCase):
    """
    Tests resetting users password via REST API by a manager.
    """

    def setUp(self):
        self.admin_client = APIClient()
        self.admin_client.login(username="admin", password="admin")

    def test_reset(self):
        user = User.objects.create(username="Test name ooMoa4ou4mohn2eo1ree")
        user.default_password = "new_password_Yuuh8OoQueePahngohy3"
        user.save()
        response = self.admin_client.post(
            reverse("user-reset-password", args=[user.pk]),
            {"password": "new_password_Yuuh8OoQueePahngohy3_new"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            User.objects.get(pk=user.pk).check_password(
                "new_password_Yuuh8OoQueePahngohy3_new"
            )
        )

    def test_set(self):
        response = self.admin_client.post(
            reverse("user_setpassword"),
            {
                "old_password": "admin",
                "new_password": "new_password_eiki5eiCoozethahhief",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        admin = User.objects.get()
        self.assertTrue(admin.check_password("new_password_eiki5eiCoozethahhief"))

    def test_set_no_manage_perms(self):
        admin = User.objects.get()
        admin.groups.add(GROUP_DELEGATE_PK)
        admin.groups.remove(GROUP_ADMIN_PK)
        inform_changed_data(admin)
        response = self.admin_client.post(
            reverse("user_setpassword"),
            {
                "old_password": "admin",
                "new_password": "new_password_ou0wei3tae5ahr7oa1Fu",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        admin = User.objects.get()
        self.assertTrue(admin.check_password("new_password_ou0wei3tae5ahr7oa1Fu"))

    def test_set_no_can_change_password(self):
        admin = User.objects.get()
        admin.groups.add(GROUP_DELEGATE_PK)
        admin.groups.remove(GROUP_ADMIN_PK)
        can_change_password_permission = Permission.objects.get(
            content_type__app_label="users", codename="can_change_password"
        )
        delegate_group = Group.objects.get(pk=GROUP_DELEGATE_PK)
        delegate_group.permissions.remove(can_change_password_permission)
        inform_changed_data(delegate_group)
        inform_changed_data(admin)

        response = self.admin_client.post(
            reverse("user_setpassword"),
            {
                "old_password": "admin",
                "new_password": "new_password_Xeereehahzie3Oochere",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        admin = User.objects.get()
        self.assertTrue(admin.check_password("admin"))

    def test_set_wrong_auth_type(self):
        admin = User.objects.get()
        admin.auth_type = "something_else"
        admin.save()
        response = self.admin_client.post(
            reverse("user_setpassword"),
            {
                "old_password": "admin",
                "new_password": "new_password_dau2ahng3Ahgha7yee8o",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        admin = User.objects.get()
        self.assertTrue(admin.check_password("admin"))

    def test_set_anonymous_user(self):
        config["general_system_enable_anonymous"] = True
        guest_client = APIClient()
        response = guest_client.post(
            reverse("user_setpassword"),
            {
                "old_password": "admin",
                "new_password": "new_password_SeeRieThahlaaf6cu8Oz",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_set_random_initial_password(self):
        """
        Tests whether a random password is set if no default password is given. The password
        must be set as the default and real password.
        """
        response = self.admin_client.post(
            reverse("user-list"), {"username": "Test name 9gt043qwvnj2d0cr"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(username="Test name 9gt043qwvnj2d0cr")
        self.assertTrue(isinstance(user.default_password, str))
        self.assertTrue(len(user.default_password) >= 8)
        self.assertTrue(user.check_password(user.default_password))

    def test_bulk_generate_new_passwords(self):
        default_password1 = "Default password e3fj3oh39hwwcbjb2qqy"
        default_password2 = "Default password 32pifjmaewrelkqwelng"
        user1 = User.objects.create(
            username="Test name r9uJoqq1k0fk09i39elq",
            default_password=default_password1,
        )
        user2 = User.objects.create(
            username="Test name poqwhfjpofmouivg73NU",
            default_password=default_password2,
        )
        user1.set_password(default_password1)
        user2.set_password(default_password2)
        self.assertTrue(user1.check_password(default_password1))
        self.assertTrue(user2.check_password(default_password2))

        response = self.admin_client.post(
            reverse("user-bulk-generate-passwords"), {"user_ids": [user1.id, user2.id]}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user1 = User.objects.get(username="Test name r9uJoqq1k0fk09i39elq")
        user2 = User.objects.get(username="Test name poqwhfjpofmouivg73NU")
        self.assertTrue(default_password1 != user1.default_password)
        self.assertTrue(default_password2 != user2.default_password)
        self.assertTrue(len(user1.default_password) >= 8)
        self.assertTrue(len(user2.default_password) >= 8)
        self.assertTrue(user1.check_password(user1.default_password))
        self.assertTrue(user2.check_password(user2.default_password))

    def test_bulk_reset_passwords_to_default_ones(self):
        default_password1 = "Default password e3fj3oh39hwwcbjb2qqy"
        default_password2 = "Default password 32pifjmaewrelkqwelng"
        user1 = User.objects.create(
            username="Test name pefkjOf9m8efNspuhPFq",
            default_password=default_password1,
        )
        user2 = User.objects.create(
            username="Test name qpymcmbmntiwoE97ev7C",
            default_password=default_password2,
        )
        user1.set_password("")
        user2.set_password("")
        self.assertFalse(user1.check_password(default_password1))
        self.assertFalse(user2.check_password(default_password2))

        response = self.admin_client.post(
            reverse("user-bulk-reset-passwords-to-default"),
            {"user_ids": [user1.id, user2.id]},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user1 = User.objects.get(username="Test name pefkjOf9m8efNspuhPFq")
        user2 = User.objects.get(username="Test name qpymcmbmntiwoE97ev7C")
        self.assertTrue(user1.check_password(default_password1))
        self.assertTrue(user2.check_password(default_password2))


class UserBulkSetState(TestCase):
    """
    Tests setting states of users.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        admin = User.objects.get()
        admin.is_active = True
        admin.is_present = True
        admin.is_committee = True
        admin.save()

    def test_set_is_present(self):
        response = self.client.post(
            reverse("user-bulk-set-state"),
            {"user_ids": [1], "field": "is_present", "value": False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(User.objects.get().is_active)
        self.assertFalse(User.objects.get().is_present)
        self.assertTrue(User.objects.get().is_committee)

    def test_invalid_field(self):
        response = self.client.post(
            reverse("user-bulk-set-state"),
            {"user_ids": [1], "field": "invalid", "value": False},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.get().is_active)
        self.assertTrue(User.objects.get().is_present)
        self.assertTrue(User.objects.get().is_committee)

    def test_invalid_value(self):
        response = self.client.post(
            reverse("user-bulk-set-state"),
            {"user_ids": [1], "field": "is_active", "value": "invalid"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.get().is_active)
        self.assertTrue(User.objects.get().is_present)
        self.assertTrue(User.objects.get().is_committee)

    def test_set_active_not_self(self):
        response = self.client.post(
            reverse("user-bulk-set-state"),
            {"user_ids": [1], "field": "is_active", "value": False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(User.objects.get().is_active)
        self.assertTrue(User.objects.get().is_present)
        self.assertTrue(User.objects.get().is_committee)


class UserBulkAlterGroups(TestCase):
    """
    Tests altering groups of users.
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.admin = User.objects.get()
        self.user = User.objects.create(username="Test name apfj31fa0ovmc8cqc8e8")

    def test_add(self):
        self.assertEqual(self.user.groups.count(), 0)
        response = self.client.post(
            reverse("user-bulk-alter-groups"),
            {
                "user_ids": [self.user.pk],
                "action": "add",
                "group_ids": [GROUP_DELEGATE_PK, GROUP_STAFF_PK],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.user.groups.count(), 2)
        self.assertTrue(self.user.groups.filter(pk=GROUP_DELEGATE_PK).exists())
        self.assertTrue(self.user.groups.filter(pk=GROUP_STAFF_PK).exists())

    def test_remove(self):
        groups = Group.objects.filter(
            pk__in=[GROUP_DEFAULT_PK, GROUP_DELEGATE_PK, GROUP_STAFF_PK]
        )
        self.user.groups.set(groups)
        response = self.client.post(
            reverse("user-bulk-alter-groups"),
            {
                "user_ids": [self.user.pk],
                "action": "remove",
                "group_ids": [GROUP_DEFAULT_PK, GROUP_STAFF_PK],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.user.groups.count(), 1)
        self.assertTrue(self.user.groups.filter(pk=GROUP_DELEGATE_PK).exists())

    def test_no_request_user(self):
        self.assertEqual(self.admin.groups.count(), 1)
        self.assertEqual(self.admin.groups.get().pk, GROUP_ADMIN_PK)
        response = self.client.post(
            reverse("user-bulk-alter-groups"),
            {
                "user_ids": [self.admin.pk],
                "action": "add",
                "group_ids": [GROUP_DELEGATE_PK],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.admin.groups.count(), 1)
        self.assertEqual(self.admin.groups.get().pk, GROUP_ADMIN_PK)

    def test_invalid_action(self):
        response = self.client.post(
            reverse("user-bulk-alter-groups"),
            {
                "user_ids": [self.admin.pk],
                "action": "invalid",
                "group_ids": [GROUP_DELEGATE_PK],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserMassImport(TestCase):
    """
    Tests mass import of users.
    """

    def test_mass_import(self):
        data = [
            {
                "first_name": "first_name_kafaith3woh3thie7Ciy",
                "last_name": "last_name_phah0jaeph9ThoongaeL",
                "groups_id": [],
            },
            {
                "first_name": "first_name_kohdao7Eibouwee8ma2O",
                "last_name": "last_name_4en5ANFoz2nQmoUkTfYe",
                "groups_id": [],
            },
            {
                "first_name": "first_name_JbCpGkpcYCaQtDNA4pDW",
                "last_name": "last_name_z0MMAIwbieKtpzW3dDJY",
                "groups_id": [],
            },
        ]
        response = self.client.post(reverse("user-mass-import"), {"users": data})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.count(), 4)

    def test_mass_import_double_username(self):
        data = [
            {"username": "double_name", "groups_id": []},
            {"username": "double_name", "groups_id": []},
        ]
        response = self.client.post(reverse("user-mass-import"), {"users": data})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            User.objects.count(), 2
        )  # second user is skipped because the username already exists

    def test_mass_import_double_name(self):
        data = [
            {"first_name": "double_name", "groups_id": []},
            {"last_name": "double_name", "groups_id": []},
        ]
        response = self.client.post(reverse("user-mass-import"), {"users": data})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            User.objects.count(), 3
        )  # if username is generated, the api appends a number behind it and thus generates both users


class UserSendIntivationEmail(TestCase):
    """
    Tests sending an email to the user.
    """

    email = "admin@test-domain.com"

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.admin = User.objects.get()
        self.admin.email = self.email
        self.admin.save()

    def test_email_sending(self):
        data = {
            "user_ids": [self.admin.pk],
            "subject": config["users_email_subject"],
            "message": config["users_email_body"],
        }
        response = self.client.post(reverse("user-mass-invite-email"), data)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to[0], self.email)


class GroupCreate(TestCase):
    """
    Tests creation of groups via REST API.
    """

    def test_creation_simple(self):
        self.client.login(username="admin", password="admin")

        response = self.client.post(
            reverse("group-list"), {"name": "Test name ldr59xq2mvt96rdayhju"}
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Group.objects.filter(name="Test name ldr59xq2mvt96rdayhju").exists()
        )

    def test_creation(self):
        self.client.login(username="admin", password="admin")
        # This contains two valid permissions of the users app.
        permissions = ("users.can_see_name", "users.can_see_extra_data")

        response = self.client.post(
            reverse("group-list"),
            {"name": "Test name la8eephu9vaecheiKeif", "permissions": permissions},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        group = Group.objects.get(name="Test name la8eephu9vaecheiKeif")
        for permission in permissions:
            app_label, codename = permission.split(".")
            self.assertTrue(
                group.permissions.get(
                    content_type__app_label=app_label, codename=codename
                )
            )

    def test_failed_creation_invalid_value(self):
        self.client.login(username="admin", password="admin")
        permissions = ("invalid_permission",)

        response = self.client.post(
            reverse("group-list"),
            {"name": "Test name ool5aeb6Rai2aiLaith1", "permissions": permissions},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {
                "permissions": [
                    'Incorrect value "invalid_permission". Expected app_label.codename string.'
                ]
            },
        )

    def test_failed_creation_invalid_permission(self):
        self.client.login(username="admin", password="admin")
        permissions = ("invalid_app.invalid_permission",)

        response = self.client.post(
            reverse("group-list"),
            {"name": "Test name wei2go2aiV3eophi9Ohg", "permissions": permissions},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {
                "permissions": [
                    'Invalid permission "invalid_app.invalid_permission". Object does not exist.'
                ]
            },
        )


class GroupUpdate(TestCase):
    """
    Tests update of groups via REST API.
    """

    def test_simple_update_via_patch(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        group_pk = GROUP_DELEGATE_PK
        # This contains one valid permission of the users app.
        permissions = ("users.can_see_name",)

        response = admin_client.patch(
            reverse("group-detail", args=[group_pk]), {"permissions": permissions}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        group = Group.objects.get(pk=group_pk)
        for permission in permissions:
            app_label, codename = permission.split(".")
            self.assertTrue(
                group.permissions.get(
                    content_type__app_label=app_label, codename=codename
                )
            )

    def test_simple_update_via_put(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        # This contains one valid permission of the users app.
        permissions = ("users.can_see_name",)

        response = admin_client.put(
            reverse("group-detail", args=[GROUP_DELEGATE_PK]),
            {"permissions": permissions},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {"name": ["This field is required."]})

    def test_update_via_put_with_new_permissions(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        group = Group.objects.create(name="group_name_inooThe3dii4mahWeeSe")
        # This contains all permissions.
        permissions = [
            "agenda.can_be_speaker",
            "agenda.can_manage",
            "agenda.can_see",
            "agenda.can_see_internal_items",
            "assignments.can_manage",
            "assignments.can_nominate_other",
            "assignments.can_nominate_self",
            "assignments.can_see",
            "core.can_manage_config",
            "core.can_manage_projector",
            "core.can_manage_tags",
            "core.can_see_frontpage",
            "core.can_see_projector",
            "mediafiles.can_manage",
            "mediafiles.can_see",
            "motions.can_create",
            "motions.can_manage",
            "motions.can_see",
            "motions.can_support",
            "users.can_manage",
            "users.can_see_extra_data",
            "users.can_see_name",
        ]

        response = admin_client.put(
            reverse("group-detail", args=[group.pk]),
            {"name": "new_group_name_Chie6duwaepoo8aech7r", "permissions": permissions},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        group = Group.objects.get(pk=group.pk)
        for permission in permissions:
            app_label, codename = permission.split(".")
            self.assertTrue(
                group.permissions.get(
                    content_type__app_label=app_label, codename=codename
                )
            )

    def test_set_single_permission(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")

        response = admin_client.post(
            reverse("group-set-permission", args=[GROUP_DEFAULT_PK]),
            {"perm": "users.can_manage", "set": True},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        group = Group.objects.get(pk=GROUP_DEFAULT_PK)
        self.assertTrue(
            group.permissions.get(
                content_type__app_label="users", codename="can_manage"
            )
        )

    def test_add_single_permission_wrong_permission(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")

        response = admin_client.post(
            reverse("group-set-permission", args=[GROUP_DEFAULT_PK]),
            {"perm": "not_existing.permission", "set": True},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_single_permission(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")

        response = admin_client.post(
            reverse("group-set-permission", args=[GROUP_DEFAULT_PK]),
            {"perm": "users.can_see_name", "set": False},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        group = Group.objects.get(pk=GROUP_DEFAULT_PK)
        self.assertFalse(
            group.permissions.filter(
                content_type__app_label="users", codename="can_see"
            ).exists()
        )


class GroupDelete(TestCase):
    """
    Tests delete of groups via REST API.
    """

    def test_delete(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        group = Group.objects.create(name="Test name Koh4lohlaewoog9Ahsh5")

        response = admin_client.delete(reverse("group-detail", args=[group.pk]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Group.objects.filter(name="Test name Koh4lohlaewoog9Ahsh5").exists()
        )

    def test_delete_builtin_groups(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")

        response = admin_client.delete(reverse("group-detail", args=[GROUP_DEFAULT_PK]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class PersonalNoteTest(TestCase):
    """
    Tests for PersonalNote model.
    """

    def setUp(self):
        self.admin = User.objects.get(username="admin")

    def test_create(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        content1 = {
            "note": "note for the example.model with id 1 Oohae1JeuSedooyeeviH",
            "star": True,
        }
        content2 = {
            "note": "note for the example.model with id 2 gegjhjynjiohnhioaaiu",
            "star": False,
        }
        response = admin_client.post(
            reverse("personalnote-create-or-update"),
            [
                {"collection": "example-model", "id": 1, "content": content1},
                {"collection": "example-model", "id": 2, "content": content2},
            ],
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(PersonalNote.objects.exists())
        personal_note = PersonalNote.objects.get()
        self.assertTrue("example-model" in personal_note.notes)
        self.assertTrue("1" in personal_note.notes["example-model"])
        self.assertTrue("2" in personal_note.notes["example-model"])
        self.assertEqual(personal_note.notes["example-model"]["1"], content1)
        self.assertEqual(personal_note.notes["example-model"]["2"], content2)

    def test_anonymous_create(self):
        guest_client = APIClient()
        response = guest_client.post(reverse("personalnote-create-or-update"), [])
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(PersonalNote.objects.exists())

    def test_update(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        personal_note = PersonalNote.objects.create(
            user=self.admin,
            notes={"test_collection": {2: "test_note_ld3mo1xjcnKNC(836qWe"}},
        )
        response = admin_client.post(
            reverse("personalnote-create-or-update"),
            [
                {
                    "collection": "test_collection",
                    "id": 2,
                    "content": "test_note_do2ncoi7ci2fm93LjwlO",
                }
            ],
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        personal_note = PersonalNote.objects.get()
        self.assertTrue("test_collection" in personal_note.notes)
        self.assertTrue("2" in personal_note.notes["test_collection"])
        self.assertEqual(
            personal_note.notes["test_collection"]["2"],
            "test_note_do2ncoi7ci2fm93LjwlO",
        )

    def test_clean_html(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        response = admin_client.post(
            reverse("personalnote-create-or-update"),
            [
                {
                    "collection": "test_collection",
                    "id": 1,
                    "content": {"note": "<p><foo>bar</foo></p>", "star": False},
                }
            ],
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        personal_note = PersonalNote.objects.get()
        self.assertEqual(
            personal_note.notes["test_collection"]["1"],
            {"note": "<p>&lt;foo&gt;bar&lt;/foo&gt;</p>", "star": False},
        )

    def test_clean_html_content_too_nested(self):
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        response = admin_client.post(
            reverse("personalnote-create-or-update"),
            [
                {
                    "collection": "test_collection",
                    "id": 1,
                    "content": [{"some:key": ["<p><foo>bar</foo></p>"]}, 3],
                }
            ],
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(PersonalNote.objects.exists())

    def test_delete_other_user(self):
        user = User.objects.create(username="user")
        admin_client = APIClient()
        admin_client.login(username="admin", password="admin")
        personal_note = PersonalNote.objects.create(
            user=user, notes="test_note_fof3joqmcufh32fn(/2f"
        )
        response = admin_client.delete(
            reverse("personalnote-detail", args=[personal_note.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(
            PersonalNote.objects.get().notes, "test_note_fof3joqmcufh32fn(/2f"
        )
