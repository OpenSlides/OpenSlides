import json

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from openslides.mediafiles.models import Mediafile
from tests.count_queries import count_queries
from tests.test_case import TestCase


@pytest.mark.django_db(transaction=False)
def test_mediafiles_db_queries():
    """
    Tests that only the following db queries are done:
    * 1 requests to get the list of all files
    * 1 request to get all lists of speakers.
    * 1 request to get all groups
    * 1 request to prefetch parents
    """
    for index in range(10):
        Mediafile.objects.create(
            title=f"some_file{index}",
            original_filename=f"some_file{index}",
            mediafile=SimpleUploadedFile(f"some_file{index}", b"some content."),
        )

    assert count_queries(Mediafile.get_elements)() == 4


class TestCreation(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.file = SimpleUploadedFile("some_file.ext", b"some content.")

    def test_simple_file(self):
        response = self.client.post(
            reverse("mediafile-list"),
            {"title": "test_title_ahyo1uifoo9Aiph2av5a", "mediafile": self.file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mediafile = Mediafile.objects.get()
        self.assertEqual(mediafile.title, "test_title_ahyo1uifoo9Aiph2av5a")
        self.assertFalse(mediafile.is_directory)
        self.assertTrue(mediafile.mediafile.name)
        self.assertEqual(mediafile.path, mediafile.original_filename)

    def test_simple_directory(self):
        response = self.client.post(
            reverse("mediafile-list"),
            {"title": "test_title_ahyo1uifoo9Aiph2av5a", "is_directory": True},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mediafile = Mediafile.objects.get()
        self.assertEqual(mediafile.title, "test_title_ahyo1uifoo9Aiph2av5a")
        self.assertTrue(mediafile.is_directory)
        self.assertEqual(mediafile.mediafile.name, "")
        self.assertEqual(mediafile.original_filename, "")
        self.assertEqual(mediafile.path, mediafile.title + "/")

    def test_file_and_directory(self):
        response = self.client.post(
            reverse("mediafile-list"),
            {
                "title": "test_title_ahyo1uifoo9Aiph2av5a",
                "is_directory": True,
                "mediafile": self.file,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Mediafile.objects.exists())

    def test_no_extension(self):
        file = SimpleUploadedFile("no_extension", b"some content.")
        response = self.client.post(
            reverse("mediafile-list"),
            {"title": "test_title_vai8oDogohheideedie4", "mediafile": file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mediafile = Mediafile.objects.get()
        self.assertEqual(mediafile.title, "test_title_vai8oDogohheideedie4")

    def test_mediafile_twice_different_title(self):
        file1 = SimpleUploadedFile("file.ext", b"some content.")
        file2 = SimpleUploadedFile("file.ext", b"some content.")
        response = self.client.post(
            reverse("mediafile-list"),
            {"title": "test_title_Zeicheipeequie3ohfid", "mediafile": file1},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mediafile = Mediafile.objects.get()
        self.assertEqual(mediafile.title, "test_title_Zeicheipeequie3ohfid")

        response = self.client.post(
            reverse("mediafile-list"),
            {"title": "test_title_aiChaetohs0quicee9eb", "mediafile": file2},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Mediafile.objects.count(), 1)

    def test_directory_twice(self):
        title = "test_title_kFJq83fjmqo2babfqk3f"
        Mediafile.objects.create(is_directory=True, title=title)
        response = self.client.post(
            reverse("mediafile-list"), {"title": title, "is_directory": True}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Mediafile.objects.count(), 1)

    def test_without_mediafile(self):
        response = self.client.post(reverse("mediafile-list"), {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Mediafile.objects.exists())

    def test_without_title(self):
        response = self.client.post(reverse("mediafile-list"), {"is_directory": True})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Mediafile.objects.exists())

    def test_with_empty_title(self):
        response = self.client.post(
            reverse("mediafile-list"), {"is_directory": True, "title": ""}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Mediafile.objects.exists())

    def test_directory_with_slash(self):
        response = self.client.post(
            reverse("mediafile-list"),
            {"title": "test_title_with_/", "is_directory": True},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Mediafile.objects.exists())

    def test_with_parent(self):
        parent_title = "test_title_3q0cqghZRFewocjwferT"
        title = "test_title_gF3if8jmvrbnwdksg4je"
        Mediafile.objects.create(is_directory=True, title=parent_title)
        response = self.client.post(
            reverse("mediafile-list"),
            {"title": title, "is_directory": True, "parent_id": 1},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Mediafile.objects.count(), 2)
        mediafile = Mediafile.objects.get(title="test_title_gF3if8jmvrbnwdksg4je")
        self.assertEqual(mediafile.parent.title, "test_title_3q0cqghZRFewocjwferT")
        self.assertEqual(mediafile.path, parent_title + "/" + title + "/")

    def test_with_file_as_parent(self):
        Mediafile.objects.create(
            title="test_title_qejOVM84gw8ghwpKnqeg", mediafile=self.file
        )
        response = self.client.post(
            reverse("mediafile-list"),
            {
                "title": "test_title_poejvvlmmorsgeroemr9",
                "is_directory": True,
                "parent_id": 1,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Mediafile.objects.count(), 1)

    def test_with_access_groups(self):
        response = self.client.post(
            reverse("mediafile-list"),
            {
                "title": "test_title_dggjwevBnUngelkdviom",
                "is_directory": True,
                "access_groups_id": [2, 4],
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Mediafile.objects.exists())
        mediafile = Mediafile.objects.get()
        self.assertEqual(
            sorted([group.id for group in mediafile.access_groups.all()]), [2, 4]
        )
        self.assertEqual(mediafile.mediafile.name, "")
        self.assertEqual(mediafile.original_filename, "")
        self.assertEqual(mediafile.path, mediafile.title + "/")

    def test_with_access_groups_wrong_json(self):
        response = self.client.post(
            reverse("mediafile-list"),
            {
                "title": "test_title_dggjwevBnUngelkdviom",
                "is_directory": True,
                "access_groups_id": json.dumps({"a": 324}),
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Mediafile.objects.exists())

    def test_with_access_groups_wrong_json2(self):
        response = self.client.post(
            reverse("mediafile-list"),
            {
                "title": "test_title_dggjwevBnUngelkdviom",
                "is_directory": True,
                "access_groups_id": "_FWEpwwfkwk",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Mediafile.objects.exists())


class TestUpdate(TestCase):
    """
    Tree:
    -dir
      -mediafileA
    -mediafileB
    """

    def setUp(self):
        self.client = APIClient()
        self.client.login(username="admin", password="admin")
        self.dir = Mediafile.objects.create(title="dir", is_directory=True)
        fileA_name = "some_fileA.ext"
        self.fileA = SimpleUploadedFile(fileA_name, b"some content.")
        self.mediafileA = Mediafile.objects.create(
            title="mediafileA",
            original_filename=fileA_name,
            mediafile=self.fileA,
            parent=self.dir,
        )
        fileB_name = "some_fileB.ext"
        self.fileB = SimpleUploadedFile(fileB_name, b"some content.")
        self.mediafileB = Mediafile.objects.create(
            title="mediafileB", original_filename=fileB_name, mediafile=self.fileB
        )

    def test_update(self):
        response = self.client.put(
            reverse("mediafile-detail", args=[self.mediafileA.pk]),
            {"title": "test_title_gpasgrmg*miGUM)EAyGO", "access_groups_id": [2, 4]},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mediafile = Mediafile.objects.get(pk=self.mediafileA.pk)
        self.assertEqual(mediafile.title, "test_title_gpasgrmg*miGUM)EAyGO")
        self.assertEqual(mediafile.path, "dir/some_fileA.ext")
        self.assertEqual(
            sorted([group.id for group in mediafile.access_groups.all()]), [2, 4]
        )

    def test_update_directory(self):
        response = self.client.put(
            reverse("mediafile-detail", args=[self.dir.pk]),
            {"title": "test_title_seklMOIGGihdjJBNaflkklnlg"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dir = Mediafile.objects.get(pk=self.dir.pk)
        self.assertEqual(dir.title, "test_title_seklMOIGGihdjJBNaflkklnlg")
        mediafile = Mediafile.objects.get(pk=self.mediafileA.pk)
        self.assertEqual(
            mediafile.path, "test_title_seklMOIGGihdjJBNaflkklnlg/some_fileA.ext"
        )

    def test_update_parent_id(self):
        """ Assert, that the parent id does not change """
        response = self.client.put(
            reverse("mediafile-detail", args=[self.mediafileA.pk]),
            {"title": self.mediafileA.title, "parent_id": None},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mediafile = Mediafile.objects.get(pk=self.mediafileA.pk)
        self.assertTrue(mediafile.parent)
        self.assertEqual(mediafile.parent.pk, self.dir.pk)
