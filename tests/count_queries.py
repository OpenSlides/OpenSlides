from django.db import DEFAULT_DB_ALIAS, connections
from django.test.utils import CaptureQueriesContext


def count_queries(func, verbose=False, *args, **kwargs) -> int:
    context = CaptureQueriesContext(connections[DEFAULT_DB_ALIAS])
    with context:
        func(*args, **kwargs)

    if verbose:
        queries = "\n".join(
            f"{i}. {query['sql']}"
            for i, query in enumerate(context.captured_queries, start=1)
        )
        print(f"{len(context)} queries executed\nCaptured queries were:\n{queries}")

    return len(context)


def assert_query_count(should_be, verbose=False):
    """
    Decorator to easily count queries on any test you want.
    should_be defines how many queries are to be expected
    """

    def outer(func):
        def inner(*args, **kwargs):
            assert count_queries(func, verbose, *args, **kwargs) == should_be

        return inner

    return outer
