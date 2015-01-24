from unittest.mock import patch

from django.dispatch import Signal
from django.test.client import RequestFactory

from openslides.utils.dispatch import SignalConnectMetaClass
from openslides.utils.test import TestCase


class TestBaseOne(object, metaclass=SignalConnectMetaClass):
    signal = Signal()

    @classmethod
    def get_dispatch_uid(cls):
        if not cls.__name__ == 'TestBaseOne':
            return 'test_vieM1eingi6luish5Sei'


class TestBaseTwo(object, metaclass=SignalConnectMetaClass):
    signal = Signal()

    @classmethod
    def get_dispatch_uid(cls):
        pass


class TestSignalConnectMetaClass(TestCase):
    request_factory = RequestFactory()

    @patch('tests.old.utils.test_dispatch.TestBaseOne.signal')
    def test_call_signal_send(self, mock_signal):
        TestBaseOne.get_all(self.request_factory.request)
        self.assertTrue(mock_signal.send.called)

    @patch('tests.old.utils.test_dispatch.TestBaseOne.signal')
    def test_call_signal_connect(self, mock_signal):
        class TestChildOne(TestBaseOne):
            pass

        self.assertTrue(mock_signal.connect.called)
        self.assertEqual(mock_signal.connect.call_args[0][0], TestChildOne)
        self.assertEqual(mock_signal.connect.call_args[1], dict(dispatch_uid='test_vieM1eingi6luish5Sei'))

    def test_bad_base_class(self):
        def wrapper():
            class BadClass1(object, metaclass=SignalConnectMetaClass):
                pass

        self.assertRaisesMessage(
            NotImplementedError,
            'Your class BadClass1 must have a get_dispatch_uid classmethod.',
            wrapper)

    def test_bad_base_class_without_signal(self):
        def wrapper():
            class BadClass2(object, metaclass=SignalConnectMetaClass):
                @classmethod
                def get_dispatch_uid(cls):
                    return True

        self.assertRaisesMessage(
            NotImplementedError,
            'Your class BadClass2 must have a signal argument, which must be a Django Signal instance.',
            wrapper)

    def test_receive_signal(self):
        class TestChildTwo(TestBaseTwo):
            def __init__(self, sender, **kwargs):
                pass

            @classmethod
            def get_dispatch_uid(self):
                return 'test_leeve5eighahT3zooxe5'

        childtwo = TestBaseTwo.get_all(self.request_factory.request)[0]
        self.assertEqual(type(childtwo), TestChildTwo)
