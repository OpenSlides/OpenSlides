from unittest import TestCase

from openslides.utils.validate import validate_html_strict


class ValidatorTest(TestCase):
    def test_XSS_protection(self):
        data = "tuveegi2Ho<a><p>tuveegi2Ho<script>kekj9(djwk</script></p>Boovai7esu</a>ee4Yaiw0ei"
        self.assertEqual(
            validate_html_strict(data),
            "tuveegi2Ho<a><p>tuveegi2Ho&lt;script&gt;kekj9(djwk&lt;/script&gt;</p>Boovai7esu</a>ee4Yaiw0ei",
        )
