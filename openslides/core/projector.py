from typing import Any, Dict

from ..utils.projector import (
    AllData,
    ProjectorElementException,
    get_config,
    register_projector_slide,
)


# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects.


async def countdown_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Countdown slide.

    Returns the full_data of the countdown element.

    element = {
        name: 'core/countdown',
        id: 5,  # Countdown ID
    }
    """
    countdown_id = element.get("id") or 1

    try:
        countdown = all_data["core/countdown"][countdown_id]
    except KeyError:
        raise ProjectorElementException(f"Countdown {countdown_id} does not exist")

    return {
        "description": countdown["description"],
        "running": countdown["running"],
        "countdown_time": countdown["countdown_time"],
        "warning_time": await get_config(all_data, "agenda_countdown_warning_time"),
    }


async def message_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    """
    Message slide.

    Returns the full_data of the message element.

    element = {
        name: 'core/projector-message',
        id: 5,  # ProjectorMessage ID
    }
    """
    message_id = element.get("id") or 1

    try:
        return all_data["core/projector-message"][message_id]
    except KeyError:
        raise ProjectorElementException(f"Message {message_id} does not exist")


async def clock_slide(
    all_data: AllData, element: Dict[str, Any], projector_id: int
) -> Dict[str, Any]:
    return {}


def register_projector_slides() -> None:
    register_projector_slide("core/countdown", countdown_slide)
    register_projector_slide("core/projector-message", message_slide)
    register_projector_slide("core/clock", clock_slide)
