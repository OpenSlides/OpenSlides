from typing import Any, Dict

from ..utils.projector import register_projector_element


# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects. They are called from an async context. So they have
#            to be fast!


def countdown(
    config: Dict[str, Any], all_data: Dict[str, Dict[int, Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Countdown slide.

    Returns the full_data of the countdown element.

    config = {
        name: 'core/countdown',
        id: 5,  # Countdown ID
    }
    """
    countdown_id = config.get("id") or 1

    try:
        return all_data["core/countdown"][countdown_id]
    except KeyError:
        return {"error": "Countdown {} does not exist".format(countdown_id)}


def message(
    config: Dict[str, Any], all_data: Dict[str, Dict[int, Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Message slide.

    Returns the full_data of the message element.

    config = {
        name: 'core/projector-message',
        id: 5,  # ProjectorMessage ID
    }
    """
    message_id = config.get("id") or 1

    try:
        return all_data["core/projector-message"][message_id]
    except KeyError:
        return {"error": "Message {} does not exist".format(message_id)}


def register_projector_elements() -> None:
    register_projector_element("core/countdown", countdown)
    register_projector_element("core/projector-message", message)
    # TODO: Deside if we need a clock slide
