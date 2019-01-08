import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from openslides.mediafiles.models import Mediafile

from ..helpers import count_queries


@pytest.mark.django_db(transaction=False)
def test_mediafiles_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all files.
    """
    for index in range(10):
        Mediafile.objects.create(
            title="some_file{}".format(index),
            mediafile=SimpleUploadedFile("some_file{}".format(index), b"some content."),
        )

    assert count_queries(Mediafile.get_elements) == 1
