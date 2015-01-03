from io import BytesIO
from textwrap import dedent

from openslides.users.csv_import import import_users
from openslides.utils.test import TestCase


class TestCSVImport(TestCase):
    def test_csv_import(self):
        # Create CSV-File
        csv_file = BytesIO(bytes(dedent("""
            "Title";"First Name";"Last Name";"Gender";"Email";"Group id";"Structure Level";"Committee";"About me";"Comment";"Is active"
            ;"Fred";"Nurk";"male";;3;"Australia";;;;1
            ;"Jan";"Jansen";"male";;3;"Belgium";;;;1
            ;"Juan";"Pérez";"male";;3;"Chile";;;;1
            """.strip()), 'utf8'))

        # Import file
        success_message, warning_message, error_message = import_users(csvfile=csv_file)

        # Test result
        self.assertEqual(warning_message, '')
        self.assertEqual(error_message, '')
