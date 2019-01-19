from typing import Any, Dict

from ..utils.projector import register_projector_element


# Important: All functions have to be prune. This means, that thay can only
#            access the data, that they get as argument and do not have any
#            side effects. They are called from an async context. So they have
#            to be fast!


def motion(
    element: Dict[str, Any], all_data: Dict[str, Dict[int, Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Motion slide.
    """
    return {"error": "TODO"}


def motion_block(
    element: Dict[str, Any], all_data: Dict[str, Dict[int, Dict[str, Any]]]
) -> Dict[str, Any]:
    """
    Motion slide.
    """
    return {"error": "TODO"}


def register_projector_elements() -> None:
    register_projector_element("motion/motion", motion)
    register_projector_element("motion/motion-block", motion_block)
