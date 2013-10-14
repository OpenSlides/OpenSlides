from django.db import models
from django.dispatch import receiver

from openslides.utils.person.models import PersonField, PersonMixin
from openslides.utils.person.signals import receive_persons


class TestPerson(PersonMixin, models.Model):
    person_prefix = 'test'
    name = models.CharField(max_length='255')

    def __unicode__(self):
        return self.name

    def get_absolute_url(self, link='detail'):
        return 'absolute_url_of_test_person'


class TestPersonToPerson(object):
    def __init__(self, person_prefix_filter=None, id_filter=None):
        self.person_prefix_filter = person_prefix_filter
        self.id_filter = id_filter

    def __iter__(self):
        if (not self.person_prefix_filter or
                self.person_prefix_filter == TestPerson.person_prefix):
            if self.id_filter:
                try:
                    yield TestPerson.objects.get(pk=self.id_filter)
                except TestPerson.DoesNotExist:
                    pass
            else:
                for user in TestPerson.objects.all():
                    yield user


@receiver(receive_persons, dispatch_uid="test_person")
def receive_persons(sender, **kwargs):
    return TestPersonToPerson(
        person_prefix_filter=kwargs['person_prefix_filter'],
        id_filter=kwargs['id_filter'])


class TestModel(models.Model):
    person = PersonField()

    def __unicode__(self):
        return self.person
