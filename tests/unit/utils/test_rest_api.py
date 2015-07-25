from unittest import TestCase

from openslides.utils.rest_api import RESTElement, ViewSet


class RESTElementTest(TestCase):
    def test_viewset_attribute_not_set(self):
        """
        Tests, an error is raised, when the attribute viewset is not set.
        """
        # Save subclasses to reset it after this test
        RESTElement_subclasses = RESTElement.subclasses
        RESTElement.subclasses = set()

        with self.assertRaises(NotImplementedError):
            class TestRESTElement(RESTElement):
                pass

        self.assertSetEqual(
            RESTElement.subclasses,
            set(),
            "RESTElement should not have any subclasses")

        RESTElement.subclasses = RESTElement_subclasses

    def test_viewset_attribute_set_to_ViewSet(self):
        """
        Tests, that it is ok to set the viewset attribute to ViewSet.
        """
        class TestRESTElement(RESTElement):
            viewset = ViewSet
            register_router = lambda: None  # Do not register any router

        # Clean up and make sure the test class was registered
        RESTElement.subclasses.remove(TestRESTElement)
