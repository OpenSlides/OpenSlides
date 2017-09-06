from typing import Any, Dict, Generator, Iterable, List, Type

from .collection import CollectionElement


class ProjectorElement:
    """
    Base class for an element on the projector.

    Every app which wants to add projector elements has to create classes
    subclassing from this base class with different names. The name attribute
    has to be set.
    """
    name = None  # type: str

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

    def get_requirements(self, config_entry: Any) -> Iterable[Any]:
        """
        Returns an iterable of instances that are required for this projector
        element. The config_entry has to be given.
        """
        return ()

    def get_requirements_as_collection_elements(self, config_entry: Any) -> Iterable[CollectionElement]:
        """
        Returns an iterable of collection elements that are required for this
        projector element. The config_entry has to be given.
        """
        return (CollectionElement.from_instance(instance) for instance in self.get_requirements(config_entry))

    def get_collection_elements_required_for_this(
            self, collection_element: CollectionElement,
            config_entry: Any) -> List[CollectionElement]:
        """
        Returns a list of CollectionElements that have to be sent to every
        projector that shows this projector element according to the given
        collection_element.

        Default: Returns only the collection_element if it belongs to the
        requirements but return all requirements if the projector changes.
        """
        requirements_as_collection_elements = list(self.get_requirements_as_collection_elements(config_entry))
        for requirement in requirements_as_collection_elements:
            if collection_element == requirement:
                output = [collection_element]
                break
        else:
            if collection_element.information.get('this_projector'):
                output = [collection_element]
                output.extend(requirements_as_collection_elements)
            else:
                output = []
        return output


projector_elements = {}  # type: Dict[str, ProjectorElement]


def register_projector_elements(elements: Generator[Type[ProjectorElement], None, None]) -> None:
    """
    Registers projector elements for later use.

    Has to be called in the app.ready method.
    """
    for Element in elements:
        element = Element()
        projector_elements[element.name] = element


def get_all_projector_elements() -> Dict[str, ProjectorElement]:
    """
    Returns all projector elements that where registered with
    register_projector_elements()
    """
    return projector_elements
