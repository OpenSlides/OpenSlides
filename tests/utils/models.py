from django.db import models


class DummyModel(models.Model):
    """
    Dummy model to test some model views.
    """
    title = models.CharField(max_length=255)
