import pytest

from openslides.core.models import Projector
from openslides.utils import utils


def test_to_roman_result():
    assert utils.to_roman(3) == "III"


def test_to_roman_none():
    assert utils.to_roman(-3) == "-3"


def test_get_model_from_collection_string_known_app():
    projector_model = utils.get_model_from_collection_string("core/projector")
    assert projector_model == Projector


def test_get_model_from_collection_string_unknown_app():
    with pytest.raises(ValueError):
        utils.get_model_from_collection_string("invalid/model")
