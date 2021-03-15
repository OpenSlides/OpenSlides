from typing import Any, Dict, Iterable, List, Optional, Tuple, Union

from django.db.models import Model
from mypy_extensions import TypedDict

from .autoupdate_bundle import AutoupdateElement, autoupdate_bundle
from .utils import is_iterable


AutoupdateFormat = TypedDict(
    "AutoupdateFormat",
    {
        "changed": Dict[str, List[Dict[str, Any]]],
        "deleted": Dict[str, List[int]],
        "from_change_id": int,
        "to_change_id": int,
        "all_data": bool,
    },
)


def disable_history() -> None:
    """"""
    with autoupdate_bundle() as bundle:
        bundle.disable_history()


def inform_changed_data(
    instances: Union[Iterable[Model], Model],
    information: List[str] = None,
    user_id: Optional[int] = None,
    disable_history: bool = False,
) -> None:
    """
    Informs the autoupdate system and the caching system about the creation or
    update of an element.

    The argument instances can be one instance or an iterable over instances.

    History creation is enabled.
    """
    if information is None:
        information = []
    if not is_iterable(instances):
        instances = (instances,)

    root_instances = set(instance.get_root_rest_element() for instance in instances)

    elements = []
    for root_instance in root_instances:
        element = AutoupdateElement(
            id=root_instance.get_rest_pk(),
            collection_string=root_instance.get_collection_string(),
            disable_history=disable_history,
            information=information,
            user_id=user_id,
        )
        elements.append(element)
    inform_elements(elements)


def inform_deleted_data(
    deleted_elements: Iterable[Tuple[str, int]],
    information: List[str] = None,
    user_id: Optional[int] = None,
) -> None:
    """
    Informs the autoupdate system and the caching system about the deletion of
    elements.

    History creation is enabled.
    """
    if information is None:
        information = []

    elements = [
        AutoupdateElement(
            id=deleted_element[1],
            collection_string=deleted_element[0],
            full_data=None,
            information=information,
            user_id=user_id,
        )
        for deleted_element in deleted_elements
    ]
    inform_elements(elements)


def inform_elements(elements: Iterable[AutoupdateElement]) -> None:
    """
    Informs the autoupdate system about some elements. This is used just to send
    some data to all users.

    If you want to save history information, user id or disable history you
    have to put information or flag inside the elements.
    """
    with autoupdate_bundle() as bundle:
        bundle.add(elements)
