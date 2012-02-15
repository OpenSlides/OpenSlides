from system import config
from projector.models import SLIDE


def get_slide_from_sid(sid):
    data = sid.split()
    if len(data) == 2:
        model = data[0]
        id = data[1]
        return SLIDE[model].objects.get(pk=id).slide()
    if len(data) == 1:
        try:
            return SLIDE[data[0]]()
        except KeyError:
            return None
    return None


def get_active_slide(only_sid=False):
    """
    Returns the active slide. If no slide is active, or it can not find an Item,
    it raise an error

    if only_sid is True, returns only the id of this item. Returns None if not Item
    is active. Does not Raise Item.DoesNotExist
    """
    sid = config["presentation"]

    if only_sid:
        return sid
    return get_slide_from_sid(sid)


def set_active_slide(sid):
    config["presentation"] = sid


def register_slidemodel(model):
    SLIDE[model.prefix] = model


def register_slidefunc(name, func):
    if ' ' in name:
        raise NameError('There can be no space in name')
    SLIDE[name] = func
