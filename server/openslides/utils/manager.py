from typing import Any, List, Optional

from django.db.models import Manager, QuerySet


class BaseManager(Manager):
    """
    A base manager for all REST-models.
    Provides a base implementation for `get_prefetched_queryset` and
    allows filtering of the queryset by ids.
    """

    def get_queryset(self, ids: Optional[List[int]] = None) -> QuerySet:
        queryset = super().get_queryset()
        if ids:
            queryset = queryset.filter(pk__in=ids)
        return queryset

    def get_prefetched_queryset(self, *args: Any, **kwargs: Any) -> QuerySet:
        return self.get_queryset(*args, **kwargs)
