from django.apps import apps


class CollectionElement:
    @classmethod
    def from_instance(cls, instance, is_deleted=False):
        """
        Returns a collection element from a database instance.
        """
        return cls(instance=instance, is_deleted=is_deleted)

    @classmethod
    def from_values(cls, collection_string, id, is_deleted=False):
        """
        Returns a collection element from a collection_string and an id.
        """
        return cls(collection_string=collection_string, id=id, is_deleted=is_deleted)

    def __init__(self, instance=None, is_deleted=False, collection_string=None, id=None):
        """
        Do not use this. Use the methods from_instance() or from_values().
        """
        if instance is not None:
            self.collection_string = instance.get_collection_string()
            self.id = instance.pk
        elif collection_string is not None and id is not None:
            self.collection_string = collection_string
            self.id = id
        else:
            raise RuntimeError(
                'Invalid state. Use CollectionElement.from_instance() or '
                'CollectionElement.from_values() but not CollectionElement() '
                'directly.')
        self.instance = instance
        self.deleted = is_deleted

    def as_channels_message(self):
        """
        Returns a dictonary that can be used to send the object through the
        channels system.
        """
        return {
            'collection_string': self.collection_string,
            'id': self.id,
            'is_deleted': self.is_deleted()}

    def as_autoupdate_for_user(self, user):
        """
        Returns a dict that can be sent through the autoupdate system for a site
        user.

        Returns None if the user can not see the element.
        """
        output = {
            'collection': self.collection_string,
            'id': self.id,
            'action': 'deleted' if self.is_deleted() else 'changed',
        }
        if not self.is_deleted():
            data = self.get_access_permissions().get_restricted_data(
                self.get_full_data(), user)
            if data is None:
                # The user is not allowed to see this element. Reset output to None.
                output = None
            else:
                output['data'] = data
        return output

    def as_autoupdate_for_projector(self):
        """
        Returns a dict that can be sent through the autoupdate system for the
        projector.

        Returns None if the projector can not see the element.
        """
        output = {
            'collection': self.collection_string,
            'id': self.id,
            'action': 'deleted' if self.is_deleted() else 'changed',
        }
        if not self.is_deleted():
            data = self.get_access_permissions().get_projector_data(
                self.get_full_data())
            if data is None:
                # The user is not allowed to see this element. Reset output to None.
                output = None
            else:
                output['data'] = data
        return output

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
            self.instance = self.get_model().objects.get(pk=self.id)
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
        """
        return self.get_access_permissions().get_full_data(self.get_instance())

    def is_deleted(self):
        """
        Returns Ture if the item is marked as deleted.
        """
        return self.deleted


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
