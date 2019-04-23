import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from openslides.mediafiles.models import Mediafile

from ..helpers import count_queries


@pytest.mark.django_db(transaction=False)
def test_mediafiles_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all files
    * 1 request to get all lists of speakers.
    """
    for index in range(10):
        Mediafile.objects.create(
            title=f"some_file{index}",
            mediafile=SimpleUploadedFile(f"some_file{index}", b"some content."),
        )

    assert count_queries(Mediafile.get_elements) == 2
