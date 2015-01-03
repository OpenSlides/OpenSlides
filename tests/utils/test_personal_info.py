from django.contrib.auth.models import AnonymousUser
from django.test.client import RequestFactory

from openslides.utils.personal_info import PersonalInfo
from openslides.utils.test import TestCase


class PersonalInfoObject(TestCase):
    def get_infoblock(self, name):
        request = RequestFactory().get('/')
        request.user = AnonymousUser()
        for infoblock in PersonalInfo.get_all(request):
            if type(infoblock).__name__ == name:
                value = infoblock
                break
        else:
            value = False
        return value

    def test_get_queryset(self):

        class TestInfoBlock_cu1Beir1zie5yeitie4e(PersonalInfo):
            pass

        infoblock = self.get_infoblock('TestInfoBlock_cu1Beir1zie5yeitie4e')
        self.assertRaisesMessage(
            NotImplementedError,
            'Your class %s has to define a get_queryset method.' % repr(TestInfoBlock_cu1Beir1zie5yeitie4e),
            infoblock.get_queryset)
