from typing import Any, Dict

from ..utils.projector import (
    ProjectorAllDataProvider,
    get_config,
    get_model,
    register_projector_slide,
)


async def countdown_slide(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    Countdown slide.

    Returns the full_data of the countdown element.

    element = {
        name: 'core/countdown',
        id: 5,  # Countdown ID
    }
    """
    countdown = await get_model(all_data_provider, "core/countdown", element.get("id"))
    return {
        "description": countdown["description"],
        "running": countdown["running"],
        "countdown_time": countdown["countdown_time"],
        "warning_time": await get_config(
            all_data_provider, "agenda_countdown_warning_time"
        ),
    }


async def message_slide(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    """
    Message slide.

    Returns the full_data of the message element.

    element = {
        name: 'core/projector-message',
        id: 5,  # ProjectorMessage ID
    }
    """
    return await get_model(
        all_data_provider, "core/projector-message", element.get("id")
    )


async def clock_slide(
    all_data_provider: ProjectorAllDataProvider,
    element: Dict[str, Any],
    projector_id: int,
) -> Dict[str, Any]:
    return {}


def register_projector_slides() -> None:
    register_projector_slide("core/countdown", countdown_slide)
    register_projector_slide("core/projector-message", message_slide)
    register_projector_slide("core/clock", clock_slide)
