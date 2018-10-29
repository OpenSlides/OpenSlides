from typing import Any, Dict, Generator, Optional, Type


class ProjectorElement:
    """
    Base class for an element on the projector.

    Every app which wants to add projector elements has to create classes
    subclassing from this base class with different names. The name attribute
    has to be set.
    """
    name: Optional[str] = None

    def check_and_update_data(self, projector_object: Any, config_entry: Any) -> Any:
        """
        Checks projector element data via self.check_data() and updates
        them via self.update_data(). The projector object and the config
        entry have to be given.
        """
        self.projector_object = projector_object
        self.config_entry = config_entry
        assert self.config_entry.get('name') == self.name, (
            'To get data of a projector element, the correct config entry has to be given.')
        self.check_data()
        return self.update_data() or {}

    def check_data(self) -> None:
        """
        Method can be overridden to validate projector element data. This
        may raise ProjectorException in case of an error.

        Default: Does nothing.
        """
        pass

    def update_data(self) -> Dict[Any, Any]:
        """
        Method can be overridden to update the projector element data
        output. This should return a dictonary. Use this for server
        calculated data which have to be forwared to the client.

        Default: Does nothing.
        """
        pass


projector_elements: Dict[str, ProjectorElement] = {}


def register_projector_elements(elements: Generator[Type[ProjectorElement], None, None]) -> None:
    """
    Registers projector elements for later use.

    Has to be called in the app.ready method.
    """
    for Element in elements:
        element = Element()
        projector_elements[element.name] = element  # type: ignore


def get_all_projector_elements() -> Dict[str, ProjectorElement]:
    """
    Returns all projector elements that where registered with
    register_projector_elements()
    """
    return projector_elements
