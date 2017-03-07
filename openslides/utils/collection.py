from django.apps import apps
from django.core.cache import cache

from .cache import get_redis_connection, use_redis_cache


class CollectionElement:
    @classmethod
    def from_instance(cls, instance, deleted=False, information=None):
        """
        Returns a collection element from a database instance.

        This will also update the instance in the cache.

        If deleted is set to True, the element is deleted from the cache.
        """
        return cls(instance=instance, deleted=deleted, information=information)

    @classmethod
    def from_values(cls, collection_string, id, deleted=False, full_data=None, information=None):
        """
        Returns a collection element from a collection_string and an id.

        If deleted is set to True, the element is deleted from the cache.

        With the argument full_data, the content of the CollectionElement can be set.
        It has to be a dict in the format that is used be access_permission.get_full_data().
        """
        return cls(collection_string=collection_string, id=id, deleted=deleted,
                   full_data=full_data, information=information)

    def __init__(self, instance=None, deleted=False, collection_string=None, id=None,
                 full_data=None, information=None):
        """
        Do not use this. Use the methods from_instance() or from_values().
        """
        self.instance = instance
        self.deleted = deleted
        self.full_data = full_data
        self.information = information or {}
        if instance is not None:
            # Collection element is created via instance
            self.collection_string = instance.get_collection_string()
            from openslides.core.config import config
            if self.collection_string == config.get_collection_string():
                # For config objects we do not work with the pk but with the key.
                self.id = instance.key
            else:
                self.id = instance.pk
        elif collection_string is not None and id is not None:
            # Collection element is created via values
            self.collection_string = collection_string
            self.id = id
        else:
            raise RuntimeError(
                'Invalid state. Use CollectionElement.from_instance() or '
                'CollectionElement.from_values() but not CollectionElement() '
                'directly.')

        if self.is_deleted():
            # Delete the element from the cache, if self.is_deleted() is True:
            self.delete_from_cache()
        else:
            # The call to get_full_data() has some sideeffects. When the object
            # was created with from_instance() or the object is not in the cache
            # then get_full_data() will save the object into the cache.
            # This will also raise a DoesNotExist error, if the object does
            # neither exist in the cache nor in the database.
            self.get_full_data()

    def __eq__(self, collection_element):
        """
        Compares two collection_elements.

        Two collection elements are equal, if they have the same collection_string
        and id.
        """
        return (self.collection_string == collection_element.collection_string and
                self.id == collection_element.id)

    def as_channels_message(self):
        """
        Returns a dictonary that can be used to send the object through the
        channels system.
        """
        channel_message = {
            'collection_string': self.collection_string,
            'id': self.id,
            'deleted': self.is_deleted()}
        if self.information:
            channel_message['information'] = self.information
        if self.full_data:
            # Do not use the method get_full_data but the attribute, so the
            # full_data is not generated.
            channel_message['full_data'] = self.full_data
        return channel_message

    def as_autoupdate(self, method, *args):
        """
        Only for internal use. Do not use it directly. Use as_autoupdate_for_user()
        or as_autoupdate_for_projector().
        """
        output = {
            'collection': self.collection_string,
            'id': self.id,
            'action': 'deleted' if self.is_deleted() else 'changed',
        }
        if not self.is_deleted():
            data = getattr(self.get_access_permissions(), method)(
                self.get_full_data(),
                *args)
            if data is None:
                # The user is not allowed to see this element. Set action to deleted.
                output['action'] = 'deleted'
            else:
                output['data'] = data
        return output

    def as_autoupdate_for_user(self, user):
        """
        Returns a dict that can be sent through the autoupdate system for a site
        user.

        The argument `user` can be anything, that is allowd as argument for
        utils.auth.has_perm().
        """
        return self.as_autoupdate(
            'get_restricted_data',
            user)

    def as_autoupdate_for_projector(self):
        """
        Returns a dict that can be sent through the autoupdate system for the
        projector.
        """
        return self.as_autoupdate(
            'get_projector_data')

    def as_dict_for_user(self, user):
        """
        Returns a dict with the data for a user. Can be used for the rest api.

        The argument `user` can be anything, that is allowd as argument for
        utils.auth.has_perm().
        """
        return self.get_access_permissions().get_restricted_data(
            self.get_full_data(),
            user)

    def get_model(self):
        """
        Returns the django model that is used for this collection.
        """
        return get_model_from_collection_string(self.collection_string)

    def get_instance(self):
        """
        Returns the instance as django object.

        May raise a DoesNotExist exception.
        """
        if self.is_deleted():
            raise RuntimeError("The collection element is deleted.")

        if self.instance is None:
            # The config instance has to be get from the config element, because
            # some config values are not in the db.
            from openslides.core.config import config
            if self.collection_string == config.get_collection_string():
                self.instance = {'key': self.id, 'value': config[self.id]}
            else:
                model = self.get_model()
                try:
                    query = model.objects.get_full_queryset()
                except AttributeError:
                    query = model.objects
                self.instance = query.get(pk=self.id)
        return self.instance

    def get_access_permissions(self):
        """
        Returns the get_access_permissions object for the this collection element.
        """
        return self.get_model().get_access_permissions()

    def get_full_data(self):
        """
        Returns the full_data of this collection_element from with all other
        dics can be generated.

        Raises a DoesNotExist error on the requested the coresponding model, if
        the object does neither exist in the cache nor in the database.
        """
        # If the full_data is already loaded, return it
        # If there is a db_instance, use it to get the full_data
        # else: try to use the cache.
        # If there is no value in the cache, get the content from the db and save
        # it to the cache.
        if self.full_data is None and self.instance is None:
            # Use the cache version if self.instance is not set.
            # After this line full_data can be None, if the element is not in the cache.
            self.full_data = cache.get(self.get_cache_key())

        if self.full_data is None:
            self.full_data = self.get_access_permissions().get_full_data(self.get_instance())
            self.save_to_cache()
        return self.full_data

    def is_deleted(self):
        """
        Returns Ture if the item is marked as deleted.
        """
        return self.deleted

    def get_cache_key(self):
        """
        Returns a string that is used as cache key for a single instance.
        """
        return get_single_element_cache_key(self.collection_string, self.id)

    def delete_from_cache(self):
        """
        Delets an element from the cache.

        Does nothing if the element is not in the cache.
        """
        # Deletes the element from the cache.
        cache.delete(self.get_cache_key())

        # Delete the id of the instance of the instance list
        Collection(self.collection_string).delete_id_from_cache(self.id)

    def save_to_cache(self):
        """
        Add or update the element to the cache.
        """
        # Set the element to the cache.
        cache.set(self.get_cache_key(), self.get_full_data())

        # Add the id of the element to the collection
        Collection(self.collection_string).add_id_to_cache(self.id)


class CollectionElementList(list):
    """
    List for collection elements that can hold collection elements from
    different collections.

    It acts like a normal python list but with the following methods.
    """

    @classmethod
    def from_channels_message(cls, message):
        """
        Creates a collection element list from a channel message.
        """
        self = cls()
        for values in message['elements']:
            self.append(CollectionElement.from_values(**values))
        return self

    def as_channels_message(self):
        """
        Returns a list of dicts that can be send through the channel system.
        """
        message = {'elements': []}
        for element in self:
            message['elements'].append(element.as_channels_message())
        return message

    def as_autoupdate_for_user(self, user):
        """
        Returns a list of dicts, that can be send though the websocket to a user.

        The argument `user` can be anything, that is allowd as argument for
        utils.auth.has_perm().
        """
        result = []
        for element in self:
            result.append(element.as_autoupdate_for_user(user))
        return result


class Collection:
    """
    Represents all elements of one collection.
    """

    def __init__(self, collection_string):
        self.collection_string = collection_string

    def get_cache_key(self, raw=False):
        """
        Returns a string that is used as cache key for a collection.

        Django adds a prefix to the cache key when using the django cache api.
        In other cases use raw=True to add the same cache key.
        """
        key = get_element_list_cache_key(self.collection_string)
        if raw:
            key = cache.make_key(key)
        return key

    def get_model(self):
        """
        Returns the django model that is used for this collection.
        """
        return get_model_from_collection_string(self.collection_string)

    def element_generator(self):
        """
        Generator that yields all collection_elements of this collection.
        """
        # Get all cache keys.
        ids = self.get_all_ids()
        cache_keys = [
            get_single_element_cache_key(self.collection_string, id)
            for id in ids]
        cached_full_data_dict = cache.get_many(cache_keys)

        # Get all ids that are missing.
        missing_cache_keys = set(cache_keys).difference(cached_full_data_dict.keys())
        missing_ids = set(
            get_collection_id_from_cache_key(cache_key)[1]
            for cache_key in missing_cache_keys)

        # Generate collection elements that where in the cache.
        for cache_key, cached_full_data in cached_full_data_dict.items():
            yield CollectionElement.from_values(
                *get_collection_id_from_cache_key(cache_key),
                full_data=cached_full_data)

        # Generate collection element that where not in the cache.
        if missing_ids:
            from openslides.core.config import config
            if self.collection_string == config.get_collection_string():
                # If config elements are not in the cache, they have to be read from
                # the config object.
                for key, value in config.items():
                    if key in missing_ids:
                        collection_element = CollectionElement.from_values(
                            config.get_collection_string(),
                            key,
                            full_data={'key': key, 'value': value})
                        # We can not use .from_instance therefore the config value
                        # is not saved to the cache. We have to do it manualy.
                        collection_element.save_to_cache()
                        yield collection_element
            else:
                model = self.get_model()
                try:
                    query = model.objects.get_full_queryset()
                except AttributeError:
                    query = model.objects
                for instance in query.filter(pk__in=missing_ids):
                    yield CollectionElement.from_instance(instance)

    def as_autoupdate_for_projector(self):
        """
        Returns a list of dictonaries to send them to the projector.
        """
        output = []
        for collection_element in self.element_generator():
            content = collection_element.as_autoupdate_for_projector()
            # Content can not be None. If the projector can not see an element,
            # then it is marked as deleted.
            output.append(content)
        return output

    def as_autoupdate_for_user(self, user):
        """
        Returns a list of dicts, that can be send though the websocket to a user.

        The argument `user` can be anything, that is allowd as argument for
        utils.auth.has_perm().
        """
        output = []
        for collection_element in self.element_generator():
            content = collection_element.as_autoupdate_for_user(user)
            if content is not None:
                output.append(content)
        return output

    def as_list_for_user(self, user):
        """
        Returns a list of dictonaries to send them to a user, for example over
        the rest api.

        The argument `user` can be anything, that is allowd as argument for
        utils.auth.has_perm().
        """
        output = []
        for collection_element in self.element_generator():
            content = collection_element.as_dict_for_user(user)
            if content is not None:
                output.append(content)
        return output

    def get_all_ids(self):
        """
        Returns a set of all ids of instances in this collection.
        """
        from openslides.core.config import config
        if self.collection_string == config.get_collection_string():
            ids = config.config_variables.keys()
        elif use_redis_cache():
            ids = self.get_all_ids_redis()
        else:
            ids = self.get_all_ids_other()
        return ids

    def get_all_ids_redis(self):
        redis = get_redis_connection()
        ids = redis.smembers(self.get_cache_key(raw=True))
        if not ids:
            ids = set(self.get_model().objects.values_list('pk', flat=True))
            if ids:
                redis.sadd(self.get_cache_key(raw=True), *ids)
        # Redis returns the ids as string.
        ids = set(int(id) for id in ids)
        return ids

    def get_all_ids_other(self):
        ids = cache.get(self.get_cache_key())
        if ids is None:
            # If it is not in the cache then get it from the database.
            ids = set(self.get_model().objects.values_list('pk', flat=True))
            cache.set(self.get_cache_key(), ids)
        return ids

    def delete_id_from_cache(self, id):
        """
        Delets a id from the cache.
        """
        if use_redis_cache():
            self.delete_id_from_cache_redis(id)
        else:
            self.delete_id_from_cache_other(id)

    def delete_id_from_cache_redis(self, id):
        redis = get_redis_connection()
        redis.srem(self.get_cache_key(raw=True), id)

    def delete_id_from_cache_other(self, id):
        ids = cache.get(self.get_cache_key())
        if ids is not None:
            ids = set(ids)
            try:
                ids.remove(id)
            except KeyError:
                # The id is not part of id list
                pass
            else:
                if ids:
                    cache.set(self.get_cache_key(), ids)
                else:
                    # Delete the key, if there are not ids left
                    cache.delete(self.get_cache_key())

    def add_id_to_cache(self, id):
        """
        Adds a collection id to the list of collection ids in the cache.
        """
        if use_redis_cache():
            self.add_id_to_cache_redis(id)
        else:
            self.add_id_to_cache_other(id)

    def add_id_to_cache_redis(self, id):
        redis = get_redis_connection()
        if redis.exists(self.get_cache_key(raw=True)):
            # Only add the value if it is in the cache.
            redis.sadd(self.get_cache_key(raw=True), id)

    def add_id_to_cache_other(self, id):
        ids = cache.get(self.get_cache_key())
        if ids is not None:
            # Only change the value if it is in the cache.
            ids = set(ids)
            ids.add(id)
            cache.set(self.get_cache_key(), ids)


def get_model_from_collection_string(collection_string):
    """
    Returns a model class which belongs to the argument collection_string.
    """
    def model_generator():
        """
        Yields all models of all apps.
        """
        for app_config in apps.get_app_configs():
            for model in app_config.get_models():
                yield model

    for model in model_generator():
        try:
            model_collection_string = model.get_collection_string()
        except AttributeError:
            # Skip models which do not have the method get_collection_string.
            pass
        else:
            if model_collection_string == collection_string:
                # The model was found.
                break
    else:
        # No model was found in all apps.
        raise ValueError('Invalid message. A valid collection_string is missing.')
    return model


def get_single_element_cache_key(collection_string, id):
    """
    Returns a string that is used as cache key for a single instance.
    """
    return "{prefix}{id}".format(
        prefix=get_single_element_cache_key_prefix(collection_string),
        id=id)


def get_single_element_cache_key_prefix(collection_string):
    """
    Returns the first part of the cache key for single elements, which is the
    same for all cache keys of the same collection.
    """
    return "{collection}:".format(collection=collection_string)


def get_element_list_cache_key(collection_string):
    """
    Returns a string that is used as cache key for a collection.
    """
    return "{collection}".format(collection=collection_string)


def get_collection_id_from_cache_key(cache_key):
    """
    Returns a tuble of the collection string and the id from a cache_key
    created with get_instance_cache_key.

    The returned id can be an integer or an string.
    """
    collection_string, id = cache_key.rsplit(':', 1)
    try:
        id = int(id)
    except ValueError:
        # The id is no integer. This can happen on config elements
        pass
    return (collection_string, id)
