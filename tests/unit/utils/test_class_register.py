from unittest import TestCase

from openslides.utils.class_register import RegisterSubclasses


class RegisterSubclassesTest(TestCase):
    def test_subclass(self):
        class Base(metaclass=RegisterSubclasses):
            pass

        class Subclass(Base):
            pass

        self.assertIn(Subclass, Base.subclasses)
        self.assertNotIn(Base, Base.subclasses)
