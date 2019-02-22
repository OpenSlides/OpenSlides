from typing import Any, Dict, List, Set

from django.db import models, transaction
from rest_framework.views import APIView as _APIView

from .autoupdate import inform_changed_data
from .rest_api import Response, ValidationError


class APIView(_APIView):
    """
    The Django Rest framework APIView with improvements for OpenSlides.
    """

    http_method_names: List[str] = []
    """
    The allowed actions have to be explicitly defined.

    Django allowes the following:
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']
    """

    def get_context_data(self, **context: Any) -> Dict[str, Any]:
        """
        Returns the context for the response.
        """
        return context

    def method_call(self, request: Any, *args: Any, **kwargs: Any) -> Any:
        """
        Http method that returns the response object with the context data.
        """
        return Response(self.get_context_data())

    # Add the http-methods and delete the method "method_call"
    get = post = put = patch = delete = head = options = trace = method_call
    del method_call


class TreeSortMixin:
    """
    Provides a handler for sorting a model tree.
    """

    def sort_tree(
        self, request: Any, model: models.Model, weight_key: str, parent_id_key: str
    ) -> None:
        """
        Sorts the all model objects represented in a tree of ids. The request data should be a list (the root)
        of all main agenda items. Each node is a dict with an id and optional children:
        {
            id: <the id>
            children: [
                <children, optional>
            ]
        }
        Every id has to be given.
        """
        if not isinstance(request.data, list):
            raise ValidationError("The data must be a list.")

        # get all item ids to verify, that the user send all ids.
        all_item_ids = set(model.objects.all().values_list("pk", flat=True))

        # The stack where all nodes to check are saved. Invariant: Each node
        # must be a dict with an id, a parent id (may be None for the root
        # layer) and a weight.
        nodes_to_check = []
        ids_found: Set[int] = set()  # Set to save all found ids.
        # Insert all root nodes.
        for index, node in enumerate(request.data):
            if not isinstance(node, dict) or not isinstance(node.get("id"), int):
                raise ValidationError("node must be a dict with an id as integer")
            node[parent_id_key] = None
            node[weight_key] = index
            nodes_to_check.append(node)

        # Traverse and check, if every id is given, valid and there are no duplicate ids.
        while len(nodes_to_check) > 0:
            node = nodes_to_check.pop()
            id = node["id"]

            if id in ids_found:
                raise ValidationError(f"Duplicate id: {id}")
            if id not in all_item_ids:
                raise ValidationError(f"Id does not exist: {id}")

            ids_found.add(id)
            # Add children, if exist.
            if isinstance(node.get("children"), list):
                for index, child in enumerate(node["children"]):
                    # ensure invariant for nodes_to_check
                    if not isinstance(node, dict) or not isinstance(
                        node.get("id"), int
                    ):
                        raise ValidationError(
                            "node must be a dict with an id as integer"
                        )
                    child[parent_id_key] = id
                    child[weight_key] = index
                    nodes_to_check.append(child)

        if len(all_item_ids) != len(ids_found):
            raise ValidationError(
                f"Did not recieved {len(all_item_ids)} ids, got {len(ids_found)}."
            )

        nodes_to_update = []
        nodes_to_update.extend(
            request.data
        )  # this will prevent mutating the request data.
        with transaction.atomic():
            while len(nodes_to_update) > 0:
                node = nodes_to_update.pop()
                id = node["id"]
                weight = node[weight_key]
                parent_id = node[parent_id_key]

                db_node = model.objects.get(pk=id)
                setattr(db_node, parent_id_key, parent_id)
                setattr(db_node, weight_key, weight)
                db_node.save(skip_autoupdate=True)
                # Add children, if exist.
                children = node.get("children")
                if isinstance(children, list):
                    nodes_to_update.extend(children)

        inform_changed_data(model.objects.all())
        return Response()
