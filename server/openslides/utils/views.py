from typing import Any, Dict, List, Set

from django.db import models, transaction
from rest_framework.views import APIView as _APIView

from .rest_api import ErrorLoggingMixin, Response, ValidationError


class APIView(ErrorLoggingMixin, _APIView):
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
        Sorts the all model objects represented in a tree of ids. The request data should
        be a list (the root) of all main models. Each node is a dict with an id and optional children:
        {
            id: <the id>
            children: [
                <children, optional>
            ]
        }
        Every id has to be given.

        This function traverses this tree in preorder to assign the weight. So even if a client
        does not have every model, the remaining models are sorted correctly.
        """
        if not isinstance(request.data, list):
            raise ValidationError({"detail": "The data must be a list."})

        # get all item ids to verify, that the user send all ids.
        all_model_ids = set(model.objects.all().values_list("pk", flat=True))

        ids_found: Set[int] = set()  # Set to save all found ids.

        fake_root: Dict[str, Any] = {"id": None, "children": []}
        fake_root["children"].extend(
            request.data
        )  # this will prevent mutating the request data.

        # The stack where all nodes to check are saved. Invariant: Each node
        # must be a dict with an id, a parent id (may be None for the root
        # layer) and a weight.
        nodes_to_check = [fake_root]
        # Traverse and check, if every id is given, valid and there are no duplicate ids.

        # The weight values are 2, 4, 6, 8,... to "make space" between entries. This is
        # some work around for the agenda: If one creates a content object with an item
        # and gives the item's parent, than the weight can be set to the parent's one +1.
        # If multiple content objects witht he same parent are created, the ordering is not
        # guaranteed.
        weight = 2
        while len(nodes_to_check) > 0:
            node = nodes_to_check.pop()
            id = node["id"]

            if id is not None:  # exclude the fake_root
                node[weight_key] = weight
                weight += 2
                if id in ids_found:
                    raise ValidationError({"detail": "Duplicate id: {0}", "args": [id]})
                if id not in all_model_ids:
                    raise ValidationError(
                        {"detail": "Id does not exist: {0}", "args": [id]}
                    )
                ids_found.add(id)

            # Add children, if exist.
            if isinstance(node.get("children"), list):
                node["children"].reverse()
                for child in node["children"]:
                    # ensure invariant for nodes_to_check
                    if not isinstance(child, dict) or not isinstance(
                        child.get("id"), int
                    ):
                        raise ValidationError(
                            {"detail": "child must be a dict with an id as integer"}
                        )
                    child[parent_id_key] = id
                    nodes_to_check.append(child)

        if len(all_model_ids) != len(ids_found):
            raise ValidationError(
                {
                    "detail": "Did not recieved {0} ids, got {1}.",
                    "args": [len(all_model_ids), len(ids_found)],
                }
            )

        # Do the actual update:
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
                db_parent_id = getattr(db_node, parent_id_key, None)
                db_weight = getattr(db_node, weight_key, -1)
                # Just update, if some attribute was changed
                if db_parent_id != parent_id or db_weight != weight:
                    setattr(db_node, parent_id_key, parent_id)
                    setattr(db_node, weight_key, weight)
                    db_node.save()
                # Add children, if exist.
                children = node.get("children")
                if isinstance(children, list):
                    nodes_to_update.extend(children)

        return Response()
