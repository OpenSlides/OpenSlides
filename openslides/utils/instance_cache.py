from django.core.cache import cache

from ..users.auth import AnonymousUser
from ..users.models import User
from .collection import get_model_from_collection_string


def get_instance(collection, id, user=None):
    """
    Gets one instance from a collection. If the instance is in the cache, the
    cached version is returned, if not, the instance is received from the
    database and afterwards saved at the cache.

    The argument user can be a integer (user-id) or a user instance. Zero stands
    for the anonymous user. If user is not None, the instance is returned as the
    user has permissions to see it. None is returned if the user can not see it
    at all. If user is None, then the master-instance is returned.
    """
    cache_key = get_instance_cache_key(collection, id)
    cached_instance = cache.get(cache_key)
    if cached_instance is None:
        # The instance is not is the cache. Get if from the database.
        cached_instance = get_instance_from_db(collection, id)

    # Apply permission filter
    cached_instance = permission_filter(collection, cached_instance, user)
    return cached_instance


def instances_generator(collection, user=None):
    """
    Like get_instance but returns all of instances of an collection as a
    generator.

    Therefore a set of all ids of the collection is saved at the cache.
    """
    # Get list of ids
    cache_key = get_instance_list_cache_key(collection)
    cached_ids = cache.get(cache_key)
    if cached_ids is None:
        Model = get_model_from_collection_string(collection)
        cached_ids = set(Model.objects.values_list('pk', flat=True).order_by('pk'))
        cache.set(cache_key, cached_ids)

    # Get all instances out of the cache
    cache_keys = [get_instance_cache_key(collection, id) for id in cached_ids]
    cached_instances = cache.get_many(cache_keys)

    # cache.get_many() ignores cache_keys that are not in the cache. Add them
    # with the value None.
    for cache_key in cache_keys:
        cached_instances.setdefault(cache_key, None)

    for cache_key, cached_instance in cached_instances.items():
        if cached_instance is None:
            # TODO: If the cache is empty, this retrieves all db entries one by
            #       one. Instead it should get all at once.
            cached_instance = get_instance_from_db(
                *get_collection_id_from_cache_key(cache_key))

        cached_instance = permission_filter(collection, cached_instance, user)
        if cached_instance is not None:
            # Only return instances where the user can see at least some data
            yield cached_instance


def del_instance(collection, id):
    """
    Delets an instance from the cache.

    Does nothing if the instance is not in the cache.
    """
    # Delete the instance from the cache
    cache.delete(get_instance_cache_key(collection, id))

    # Delete the id of the instance of the instance list
    cache_key = get_instance_list_cache_key(collection)
    cached_ids = set(cache.get(cache_key))
    if cached_ids is not None:
        try:
            cached_ids.remove(id)
        except KeyError:
            # The id is not part of id list
            pass
        else:
            # TODO: This can be a problem if two different ids are removed from
            #       cache at the same time by different threads. Therefore we
            #       need some kind of blocking or an atomic operation.
            if cached_ids:
                cache.set(cache_key, cached_ids)
            else:
                # Delete the key, if there are not ids left
                cache.delete(cache_key)


def update_instance(collection, id):
    """
    Changes the instance inside the cache.

    If the instance is not in the cache, then it is added.
    """
    # Update the instance in the cache
    get_instance_from_db(collection, id)

    # Add the id of the instance in the instance list
    # Do nothing if the ids are currently not in the cache
    cache_key = get_instance_list_cache_key(collection)
    cached_ids = cache.get(cache_key)
    if cached_ids is not None:
        cached_ids = set(cached_ids)
        cached_ids.add(id)
        cache.set(cache_key, cached_ids)


def get_instance_from_db(collection, id):
    """
    Gets an instance from the db.

    Also saves this instance into the cache.
    """
    cache_key = get_instance_cache_key(collection, id)
    Model = get_model_from_collection_string(collection)
    instance = Model.objects.get(pk=id)
    access_permissions = instance.get_access_permissions()
    full_data = access_permissions.get_full_data(instance)
    cache.set(cache_key, full_data)
    return full_data


def permission_filter(collection, instance, user):
    # Apply permission filter
    if user is not None:
        if user == 0:
            user = AnonymousUser()

        if isinstance(user, int):
            # user is the id of an user instance.
            # TODO: get_instance could be used here to get the cached version of
            #       the user.
            user = User.objects.get(pk=user)

        Model = get_model_from_collection_string(collection)
        # TODO: access_permissions is normaly get by get_access_permissions().
        #       but in this case there is only the Class and get_access_permissions()
        #       is not a classmethod.
        access_permissions = Model.access_permissions
        instance = access_permissions.get_restricted_data(instance, user)
    return instance


def get_instance_cache_key(collection, id):
    """
    Returns a string that is used as cache key for a single instance.
    """
    # If you change this function, you also have to change get_collection_id_from_cache_key
    return "{collection}:{id}".format(collection=collection, id=id)


def get_instance_list_cache_key(collection):
    """
    Returns a string that is used as cache key for a list of instances.
    """
    return "{collection}".format(collection=collection)


def get_collection_id_from_cache_key(cache_key):
    """
    Returns a tuble of the collection string and the id from a cache_key
    created with get_instance_cache_key.
    """
    return cache_key.rsplit(':', 1)
