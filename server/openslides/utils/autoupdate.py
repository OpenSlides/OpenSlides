from collections import defaultdict
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union

from django.db.models import Model
from mypy_extensions import TypedDict

from .auth import UserDoesNotExist
from .autoupdate_bundle import AutoupdateElement, autoupdate_bundle
from .cache import ChangeIdTooLowError, element_cache
from .utils import is_iterable, split_element_id


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
    no_delete_on_restriction: bool = False,
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
            no_delete_on_restriction=no_delete_on_restriction,
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


async def get_autoupdate_data(
    from_change_id: int, user_id: int
) -> Tuple[int, Optional[AutoupdateFormat]]:
    try:
        return await _get_autoupdate_data(from_change_id, user_id)
    except UserDoesNotExist:
        return 0, None


async def _get_autoupdate_data(
    from_change_id: int, user_id: int
) -> Tuple[int, Optional[AutoupdateFormat]]:
    """
    Returns the max_change_id and the autoupdate from from_change_id to max_change_id
    """
    try:
        (
            max_change_id,
            changed_elements,
            deleted_element_ids,
        ) = await element_cache.get_data_since(user_id, from_change_id)
    except ChangeIdTooLowError:
        # The change_id is lower the the lowerst change_id in redis. Return all data
        (
            max_change_id,
            changed_elements,
        ) = await element_cache.get_all_data_list_with_max_change_id(user_id)
        deleted_elements: Dict[str, List[int]] = {}
        all_data = True
    else:
        all_data = False
        deleted_elements = defaultdict(list)
        for element_id in deleted_element_ids:
            collection_string, id = split_element_id(element_id)
            deleted_elements[collection_string].append(id)

    # Check, if the autoupdate has any data.
    if not changed_elements and not deleted_element_ids:
        # Skip empty updates
        return max_change_id, None
    else:
        # Normal autoupdate with data
        return (
            max_change_id,
            AutoupdateFormat(
                changed=changed_elements,
                deleted=deleted_elements,
                from_change_id=from_change_id,
                to_change_id=max_change_id,
                all_data=all_data,
            ),
        )
