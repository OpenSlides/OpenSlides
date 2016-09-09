from django.apps import apps


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
