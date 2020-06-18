from unittest import TestCase
from unittest.mock import MagicMock, patch

from openslides.users.serializers import UserSerializer
from openslides.utils.rest_api import ValidationError


class UserCreateUpdateSerializerTest(TestCase):
    def test_validate_no_data(self):
        """
        Tests, that the validator raises a ValidationError, if not data is given.
        """
        serializer = UserSerializer()
        data: object = {}

        with self.assertRaises(ValidationError):
            serializer.validate(data)

    @patch("openslides.users.serializers.User.objects.generate_username")
    def test_validate_no_username(self, generate_username):
        """
        Tests, that an empty username is generated.
        """
        generate_username.return_value = "test_value"
        serializer = UserSerializer()
        data = {"first_name": "TestName"}

        new_data = serializer.validate(data)

        self.assertEqual(new_data["username"], "test_value")

    def test_validate_no_username_in_patch_request(self):
        """
        Tests, that an empty username is not set in a patch request context.
        """
        view = MagicMock(action="partial_update")
        serializer = UserSerializer(context={"view": view})
        data = {"first_name": "TestName"}

        new_data = serializer.validate(data)

        self.assertIsNone(new_data.get("username"))
