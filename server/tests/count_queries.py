from typing import Callable

from django.db import DEFAULT_DB_ALIAS, connections
from django.test.utils import CaptureQueriesContext


def count_queries(func, verbose=False) -> Callable[..., int]:
    def wrapper(*args, **kwargs) -> int:
        context = CaptureQueriesContext(connections[DEFAULT_DB_ALIAS])
        with context:
            func(*args, **kwargs)

        if verbose:
            print(get_verbose_queries(context))

        return len(context)

    return wrapper


class AssertNumQueriesContext(CaptureQueriesContext):
    def __init__(self, test_case, num, verbose):
        self.test_case = test_case
        self.num = num
        self.verbose = verbose
        super().__init__(connections[DEFAULT_DB_ALIAS])

    def __exit__(self, exc_type, exc_value, traceback):
        super().__exit__(exc_type, exc_value, traceback)
        if exc_type is not None:
            return
        executed = len(self)
        verbose_queries = get_verbose_queries(self)
        if self.verbose:
            print(verbose_queries)
            self.test_case.assertEqual(executed, self.num)
        else:
            self.test_case.assertEqual(executed, self.num, verbose_queries)


def get_verbose_queries(context):
    queries = "\n".join(
        f"{i}. {query['sql']}"
        for i, query in enumerate(context.captured_queries, start=1)
    )
    return f"{len(context)} queries executed\nCaptured queries were:\n{queries}"
