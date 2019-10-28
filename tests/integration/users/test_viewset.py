import pytest
from django.core import mail
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.core.config import config
from openslides.users.models import Group, PersonalNote, User
from openslides.utils.autoupdate import inform_changed_data
from tests.test_case import TestCase

from ...common_groups import (
    GROUP_ADMIN_PK,
    GROUP_DEFAULT_PK,
    GROUP_DELEGATE_PK,
    GROUP_STAFF_PK,
)
from ..helpers import count_queries


@pytest.mark.django_db(transaction=False)
def test_user_db_queries():
    """
    Tests that only the following db queries are done:
    * 2 requests to get the list of all users and
    * 1 requests to get the list of all groups.
    """
    for index in range(10):
        User.objects.create(username=f"user{index}")

    assert count_queries(User.get_elements) == 3


@pytest.mark.django_db(transaction=False)
def test_group_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 request to get the list of all groups.
    * 1 request to get the permissions
    """
    for index in range(10):
        Group.objects.create(name=f"group{index}")

    assert count_queries(Group.get_elements) == 2


class UserGetTest(TestCase):
    """
    Tests to receive a users via REST API.
    """

    def test_get_with_user_who_is_in_group_with_pk_1(self):
        """
        It is invalid, that a user is in the group with the pk 1. But if the
        database is invalid, the user should nevertheless be received.
        """
        admin = User.objects.get(username="admin")
        group1 = Group.objects.get(pk=1)
        admin.groups.add(group1)
        self.client.login(username="admin", password="admin")

        response = self.client.get("/rest/users/user/1/")

        self.assertEqual(response.status_code, 200)

    def test_get_with_user_without_permissions(self):
        group = Group.objects.get(pk=1)
        permission_string = "users.can_see_name"
        app_label, codename = permission_string.split(".")
        permission = group.permissions.get(
            content_type__app_label=app_label, codename=codename
        )
        group.permissions.remove(permission)
        inform_changed_data(group)
        config["general_system_enable_anonymous"] = True
        guest_client = APIClient()

        response = guest_client.get("/rest/users/user/1/")

        self.assertEqual(response.status_code, 404)


class UserCreate(TestCase):
    """
    Tests creation of users via REST API.
    """

    def test_simple_creation(self):
        self.client.login(username="admin", password="admin")

        response = self.client.post(
            reverse("user-list"), {"last_name": "Test name keimeiShieX4Aekoe3do"}
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(username="Test name keimeiShieX4Aekoe3do")
        self.assertEqual(response.data["id"], new_user.id)

    def test_creation_with_group(self):
        self.client.login(username="admin", password="admin")
        group_pks = (GROUP_DELEGATE_PK, GROUP_STAFF_PK)

        self.client.post(
            reverse("user-list"),
            {"last_name": "Test name aedah1iequoof0Ashed4", "groups_id": group_pks},
        )

        user = User.objects.get(username="Test name aedah1iequoof0Ashed4")
        self.assertTrue(user.groups.filter(pk=group_pks[0]).exists())
        self.assertTrue(user.groups.filter(pk=group_pks[1]).exists())

    def test_creation_with_default_group(self):
        self.client.login(username="admin", password="admin")
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
            reverse("user-bulk-generate-passwords"),
            {"user_ids": [user1.id, user2.id]},
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

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")

    def test_mass_import(self):
        user_1 = {
            "first_name": "first_name_kafaith3woh3thie7Ciy",
            "last_name": "last_name_phah0jaeph9ThoongaeL",
            "groups_id": [],
        }
        user_2 = {
            "first_name": "first_name_kohdao7Eibouwee8ma2O",
            "last_name": "last_name_kafaith3woh3thie7Ciy",
            "groups_id": [],
        }
        response = self.client.post(
            reverse("user-mass-import"), {"users": [user_1, user_2]}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.count(), 3)


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
        response = self.client.post(
            reverse("user-mass-invite-email"), data
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to[0], self.email)


class GroupMetadata(TestCase):
    def test_options_request_as_anonymous_user_activated(self):
        config["general_system_enable_anonymous"] = True

        response = self.client.options("/rest/users/group/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Group List")
        perm_list = response.data["actions"]["POST"]["permissions"]["choices"]
        self.assertEqual(type(perm_list), list)
        for item in perm_list:
            self.assertEqual(type(item), dict)
            self.assertTrue(item.get("display_name") is not None)
            self.assertTrue(item.get("value") is not None)


class GroupReceive(TestCase):
    def setUp(self):
        pass

    def test_get_groups_as_anonymous_deactivated(self):
        """
        Test to get the groups with an anonymous user, when they are deactivated.
        """
        response = self.client.get("/rest/users/group/")

        self.assertEqual(response.status_code, 403)

    def test_get_groups_as_anonymous_user_activated(self):
        """
        Test to get the groups with an anonymous user, when they are activated.
        """
        config["general_system_enable_anonymous"] = True

        response = self.client.get("/rest/users/group/")

        self.assertEqual(response.status_code, 200)

    def test_logged_in_user_with_no_permission(self):
        """
        Test to get the groups with an logged in user with no permissions.
        """
        user = User(username="test")
        user.set_password("test")
        user.save()
        default_group = Group.objects.get(pk=GROUP_DEFAULT_PK)
        default_group.permissions.all().delete()
        self.client.login(username="test", password="test")

        response = self.client.get("/rest/users/group/")

        self.assertEqual(response.status_code, 200)


class GroupCreate(TestCase):
    """
    Tests creation of groups via REST API.
    """

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

    def test_anonymous_without_personal_notes(self):
        personal_note = PersonalNote.objects.create(
            user=self.admin, notes='["admin_personal_note_OoGh8choro0oosh0roob"]'
        )
        config["general_system_enable_anonymous"] = True
        guest_client = APIClient()
        response = guest_client.get(
            reverse("personalnote-detail", args=[personal_note.pk])
        )
        self.assertEqual(response.status_code, 404)

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
        response = guest_client.post(
            reverse("personalnote-create-or-update"), []
        )
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
