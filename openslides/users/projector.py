from typing import Generator, Type

from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement
from .models import User


class UserSlide(ProjectorElement):
    """
    Slide definitions for User model.
    """

    name = "users/user"

    def check_data(self):
        if not User.objects.filter(pk=self.config_entry.get("id")).exists():
            raise ProjectorException("User does not exist.")


def get_projector_elements() -> Generator[Type[ProjectorElement], None, None]:
    yield UserSlide
