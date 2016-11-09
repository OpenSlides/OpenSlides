import os
import shutil

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from django.db.models import QuerySet
from whoosh import fields
from whoosh.filedb.filestore import RamStorage
from whoosh.index import create_in, exists_in, open_dir
from whoosh.qparser import QueryParser
from whoosh.writing import AsyncWriter


def get_schema():
    """
    This method creates the whoosh schema. It is only needed when the search
    index is build. After this, the schema is saved and loaded with the index.

    When the schema is changed, then the index has to be recreated or the index
    has to be altert. See:
    https://pythonhosted.org/Whoosh/schema.html#modifying-the-schema-after-indexing
    """
    return fields.Schema(
        id=fields.ID(stored=True),
        collection=fields.ID(stored=True),
        id_collection=fields.ID(unique=True),
        content=fields.TEXT)


class Index:
    """
    Represents the whoosh index.
    """

    def get_index_path(self):
        """
        Returns the index path.

        Raises ImproperlyConfigured if the path is not set in the settings.
        """
        try:
            return settings.SEARCH_INDEX
        except AttributeError:
            raise ImproperlyConfigured("Set SEARCH_INDEX into your settings.")

    def create_index(self):
        """
        Creats the whoosh index. Delets an existing index if exists.

        Returns the index.
        """
        path = self.get_index_path()
        if path == 'ram':
            self.storage = RamStorage().create_index(get_schema())
        else:
            if os.path.exists(path):
                shutil.rmtree(path)
            os.mkdir(path)
            self.storage = create_in(path, get_schema())
        return self.storage

    def get_or_create_index(self):
        """
        Returns an index object.

        Creats the index if it does not exist
        """
        # Try to return a storage object that was created before.
        try:
            return self.storage
        except AttributeError:
            pass
        path = self.get_index_path()
        if path != 'ram' and exists_in(path):
            return open_dir(path)
        return self.create_index()


index = Index()


def combine_id_and_collection(instance):
    """
    Returns a string where the id and the collection string of an instance
    are combined.
    """
    return "{}{}".format(instance.id, instance.get_collection_string())


def user_name_helper(users):
    """
    Helper to index a user or a list of users.

    Returns a string which contains the names of all users seperated by a space.

    users can be a list, a queryset or an user object. If it is something else
    then the str(users) is returned.
    """
    if isinstance(users, list) or isinstance(users, QuerySet):
        user_string = " ".join(str(user) for user in users)
    elif isinstance(users, get_user_model()):
        user_string = str(users)
    else:
        user_string = str(users)
    return user_string


def index_add_instance(sender, instance, **kwargs):
    """
    Receiver that should be called by the post_save signal and the m2m_changed
    signal.

    If the instance has an method get_search_string, then it is written
    into the search index. The method has to return an dictonary that can be
    used as keyword arguments to writer.add_document.

    This function uses whoosh.writing.AsyncWriter.
    """
    try:
        get_search_index_string = instance.get_search_index_string
    except AttributeError:
        # If the instance is not searchable, then exit this signal early.
        return

    created = kwargs.get('created', False)

    writer_kwargs = {
        'id_collection': combine_id_and_collection(instance),
        'id': str(instance.pk),
        'collection': instance.get_collection_string(),
        'content': get_search_index_string()}

    with AsyncWriter(index.get_or_create_index()) as writer:
        if created:
            writer.add_document(**writer_kwargs)
        else:
            writer.update_document(**writer_kwargs)


def index_del_instance(sender, instance, **kwargs):
    """
    Like index_add_instance but deletes the instance from the index.

    Should be called by the post_delete signal.

    This function uses whoosh.writing.AsyncWriter.
    """
    try:
        # Try to get the arrribute get_search_attributes. It is not needed
        # in this method (and therefore not called) but it tells us if the
        # instance is searchable.
        instance.get_search_index_string
    except AttributeError:
        # If the instance is not searchable, then exit this signal early.
        return

    with AsyncWriter(index.get_or_create_index()) as writer:
        writer.delete_by_term('id_collection', combine_id_and_collection(instance))


def search(query):
    """
    Searchs elements.

    query has to be a query string. See: https://pythonhosted.org/Whoosh/querylang.html

    The return value is a list of dictonaries where each dictonary has the keys
    id and collection.
    """
    search_index = index.get_or_create_index()
    parser = QueryParser("content", search_index.schema)
    query = parser.parse(query)
    result = search_index.searcher().search(query, limit=None)
    return [dict(element) for element in result]
