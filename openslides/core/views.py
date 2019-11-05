import datetime
import os
from collections import defaultdict
from typing import Any, Dict

from asgiref.sync import async_to_sync
from django.conf import settings
from django.contrib.staticfiles import finders
from django.contrib.staticfiles.views import serve
from django.db.models import F
from django.http import Http404, HttpResponse
from django.utils.timezone import now
from django.views import static
from django.views.generic.base import View

from openslides.utils.utils import split_element_id

from .. import __license__ as license, __url__ as url, __version__ as version
from ..users.models import User
from ..utils import views as utils_views
from ..utils.arguments import arguments
from ..utils.auth import GROUP_ADMIN_PK, anonymous_is_enabled, has_perm, in_some_groups
from ..utils.autoupdate import inform_changed_data
from ..utils.cache import element_cache
from ..utils.plugins import (
    get_plugin_description,
    get_plugin_license,
    get_plugin_url,
    get_plugin_verbose_name,
    get_plugin_version,
)
from ..utils.rest_api import (
    GenericViewSet,
    ListModelMixin,
    ModelViewSet,
    Response,
    RetrieveModelMixin,
    ValidationError,
    detail_route,
    list_route,
)
from .access_permissions import (
    ConfigAccessPermissions,
    CountdownAccessPermissions,
    ProjectionDefaultAccessPermissions,
    ProjectorAccessPermissions,
    ProjectorMessageAccessPermissions,
    TagAccessPermissions,
)
from .config import config
from .exceptions import ConfigError, ConfigNotFound
from .models import (
    ConfigStore,
    Countdown,
    History,
    HistoryData,
    ProjectionDefault,
    Projector,
    ProjectorMessage,
    Tag,
)
from .serializers import elements_array_validator, elements_validator


# Special Django views


class IndexView(View):
    """
    The primary view for the OpenSlides client. Serves static files. If a file
    does not exist or a directory is requested, the index.html is delivered instead.
    """

    cache: Dict[str, str] = {}
    """
    Saves the path to the index.html.

    May be extended later to cache every template.
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        no_caching = arguments.get("no_template_caching", False)
        if "index" not in self.cache or no_caching:
            self.cache["index"] = finders.find("index.html")

        self.index_document_root, self.index_path = os.path.split(self.cache["index"])

    def get(self, request, path, **kwargs) -> HttpResponse:
        """
        Tries to serve the requested file. If it is not found or a directory is
        requested, the index.html is delivered.
        """
        try:
            response = serve(request, path, insecure=True, **kwargs)
        except Http404:
            response = static.serve(
                request,
                self.index_path,
                document_root=self.index_document_root,
                **kwargs,
            )
        return response


# Viewsets for the REST API


class ProjectorViewSet(ModelViewSet):
    """
    API endpoint for the projector slide info.

    There are the following views: See strings in check_view_permissions().
    """

    access_permissions = ProjectorAccessPermissions()
    queryset = Projector.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == "metadata":
            result = has_perm(self.request.user, "core.can_see_projector")
        elif self.action in (
            "create",
            "update",
            "partial_update",
            "destroy",
            "control_view",
            "set_scroll",
            "set_reference_projector",
            "project",
        ):
            result = has_perm(self.request.user, "core.can_see_projector") and has_perm(
                self.request.user, "core.can_manage_projector"
            )
        else:
            result = False
        return result

    def perform_create(self, serializer):
        projector = serializer.save()
        projector.elements = [{"name": "core/clock", "stable": True}]
        projector.save()

    def update(self, *args, **kwargs):
        """
        Updates the projector.
        Informs about changed projectors due to changes in projection defaults:
        Collects all former projectors that were assigned to new projection defaults
        during the update.
        """
        projector = self.get_object()

        # old_pd_ids and new_pd_ids (see below) are for detecting changed projectiondefaults.
        old_pd_ids = set([default.id for default in projector.projectiondefaults.all()])

        # maps all projection defaults to their projectors. So we can find out later the
        # old projectors to changes projection defaults.
        old_pd_projector_mapping = {
            pd.id: pd.projector_id for pd in ProjectionDefault.objects.all()
        }

        response = super().update(*args, **kwargs)

        # calculate changed projection defaults
        new_pd_ids = set([default.id for default in projector.projectiondefaults.all()])
        changed_pd_ids = list(new_pd_ids - old_pd_ids)
        inform_changed_data(ProjectionDefault.objects.filter(pk__in=changed_pd_ids))

        # Find *old* projector ids for the changed defaults
        affected_projector_ids = [
            old_pd_projector_mapping[pd_id] for pd_id in changed_pd_ids
        ]
        inform_changed_data(Projector.objects.filter(pk__in=affected_projector_ids))

        return response

    def destroy(self, *args, **kwargs):
        """
        REST API operation for DELETE requests.

        Assigns all ProjectionDefault objects from this projector to the
        first projector found.
        """
        if len(Projector.objects.all()) <= 1:
            raise ValidationError({"detail": "You can't delete the last projector."})
        projector_instance = self.get_object()
        new_projector_id = (
            Projector.objects.exclude(pk=projector_instance.pk).first().pk
        )

        for projection_default in ProjectionDefault.objects.all():
            if projection_default.projector.id == projector_instance.id:
                projection_default.projector_id = new_projector_id
                projection_default.save()
        return super(ProjectorViewSet, self).destroy(*args, **kwargs)

    @detail_route(methods=["post"])
    def project(self, request, pk):
        """
        Sets the `elements` and `elements_preview` and adds one item to the
        `elements_history`.

        `request.data` can have three arguments: `append_to_history`, `elements`
        and `preview`. Non of them is required.

        `append_to_history` adds one element to the end of the history_elements.
        `elements` and `preview` preplaces the coresponding fields in the
        database.

        If `delete_last_history_element` is True, the last element is deleted.
        Note: You cannot give `append_to_history` and `delete_last_history_element`
        at the same time.

        If `reset_scroll` is True, the scoll of the projector will reset.
        """
        projector = self.get_object()
        elements = request.data.get("elements")
        preview = request.data.get("preview")
        history_element = request.data.get("append_to_history")
        delete_last_history_element = request.data.get(
            "delete_last_history_element", False
        )
        reset_scroll = request.data.get("reset_scroll", False)

        if elements is not None:
            elements_validator(elements)
            projector.elements = elements

        if preview is not None:
            elements_validator(preview)
            projector.elements_preview = preview

        elements_history = None
        if history_element is not None and delete_last_history_element is False:
            elements_history = projector.elements_history + [history_element]
        if history_element is None and delete_last_history_element is True:
            elements_history = projector.elements_history[:-1]
        if elements_history is not None:
            elements_array_validator(elements_history)
            projector.elements_history = elements_history

        if reset_scroll:
            projector.scroll = 0

        projector.save()
        return Response()

    @detail_route(methods=["post"])
    def control_view(self, request, pk):
        """
        REST API operation to control the projector view, i. e. scale and
        scroll the projector.

        It expects a POST request to
        /rest/core/projector/<pk>/control_view/ with a dictionary with an
        action ('scale' or 'scroll') and a direction ('up', 'down' or
        'reset'). An optional 'step' can be given to control the amount
        of scrolling and scaling. The default is 1.

        Example:

        {
            "action": "scale",
            "direction": "up"
        }
        """
        if not isinstance(request.data, dict):
            raise ValidationError({"detail": "Data must be a dictionary."})
        if request.data.get("action") not in ("scale", "scroll") or request.data.get(
            "direction"
        ) not in ("up", "down", "reset"):
            raise ValidationError(
                {
                    "detail": "Data must be a dictionary with an action ('scale' or 'scroll') "
                    "and a direction ('up', 'down' or 'reset')."
                }
            )

        projector_instance = self.get_object()
        step = request.data.get("step", 1)
        if step < 1:
            step = 1

        if request.data["action"] == "scale":
            if request.data["direction"] == "up":
                projector_instance.scale = F("scale") + step
            elif request.data["direction"] == "down":
                projector_instance.scale = F("scale") - step
            else:
                # request.data['direction'] == 'reset'
                projector_instance.scale = 0
        else:
            # request.data['action'] == 'scroll'
            if request.data["direction"] == "up":
                projector_instance.scroll = F("scroll") + step
            elif request.data["direction"] == "down":
                projector_instance.scroll = F("scroll") - step
            else:
                # request.data['direction'] == 'reset'
                projector_instance.scroll = 0

        projector_instance.save(skip_autoupdate=True)
        projector_instance.refresh_from_db()
        inform_changed_data(projector_instance)
        return Response()

    @detail_route(methods=["post"])
    def set_scroll(self, request, pk):
        """
        REST API operation to scroll the projector.

        It expects a POST request to
        /rest/core/projector/<pk>/set_scroll/ with a new value for scroll.
        """
        if not isinstance(request.data, int):
            raise ValidationError({"detail": "Data must be an int."})

        projector_instance = self.get_object()
        projector_instance.scroll = request.data

        projector_instance.save()
        return Response(
            {"detail": "Setting scroll to {0} was successful.", "args": [request.data]}
        )

    @detail_route(methods=["post"])
    def set_reference_projector(self, request, pk):
        """
        REST API operation to set the projector with the given pk as the new reference projector for all projectors.
        """
        reference_projector = self.get_object()
        for projector in self.queryset.all():
            projector.reference_projector = reference_projector
            projector.save()

        return Response()


class ProjectionDefaultViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    """
    API endpoint for projection defaults.

    There are the following views: list, and retrieve. Assigning projection defaults
    to projectors can be done by updating the projector.
    """

    access_permissions = ProjectionDefaultAccessPermissions()
    queryset = ProjectionDefault.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        else:
            result = False
        return result


class TagViewSet(ModelViewSet):
    """
    API endpoint for tags.

    There are the following views: metadata, list, retrieve, create,
    partial_update, update and destroy.
    """

    access_permissions = TagAccessPermissions()
    queryset = Tag.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action == "metadata":
            # Every authenticated user can see the metadata.
            # Anonymous users can do so if they are enabled.
            result = self.request.user.is_authenticated or anonymous_is_enabled()
        elif self.action in ("create", "partial_update", "update", "destroy"):
            result = has_perm(self.request.user, "core.can_manage_tags")
        else:
            result = False
        return result


class ConfigViewSet(ModelViewSet):
    """
    API endpoint for the config.

    There are the following views: metadata, list, retrieve, update and
    partial_update.
    """

    access_permissions = ConfigAccessPermissions()
    queryset = ConfigStore.objects.all()

    can_manage_config = None
    can_manage_logos_and_fonts = None

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ("partial_update", "update"):
            result = self.check_config_permission(self.kwargs["pk"])
        elif self.action == "reset_groups":
            result = has_perm(self.request.user, "core.can_manage_config")
        elif self.action == "bulk_update":
            result = True  # will be checked in the view
        else:
            result = False
        return result

    def check_config_permission(self, key):
        """
        Checks the permissions for one config key.
        Users needs 'core.can_manage_logos_and_fonts' for all config values starting
        with 'logo' and 'font'. For all other config values the user needs the default
        permissions 'core.can_manage_config'.
        The result is cached for one request to reduce has_perm queries in e.g. bulk updates.
        """
        if key.startswith("logo") or key.startswith("font"):
            if self.can_manage_logos_and_fonts is None:
                self.can_manage_logos_and_fonts = has_perm(
                    self.request.user, "core.can_manage_logos_and_fonts"
                )
            return self.can_manage_logos_and_fonts
        else:
            if self.can_manage_config is None:
                self.can_manage_config = has_perm(
                    self.request.user, "core.can_manage_config"
                )
            return self.can_manage_config

    def update(self, request, *args, **kwargs):
        """
        Updates a config variable. Only managers can do this.

        Example: {"value": 42}
        """
        key = kwargs["pk"]
        value = request.data.get("value")

        # Validate and change value.
        try:
            config[key] = value
        except ConfigNotFound:
            raise Http404
        except ConfigError as err:
            raise ValidationError({"detail": str(err)})

        # Return response.
        return Response({"key": key, "value": value})

    @list_route(methods=["post"])
    def bulk_update(self, request):
        """
        Updates many config variables:
        [{key: <key>, value: <value>}, ...]
        """
        if not isinstance(request.data, list):
            raise ValidationError({"detail": "The data needs to be a list"})

        for entry in request.data:
            key = entry.get("key")
            if not isinstance(key, str):
                raise ValidationError({"detail": "The key must be a string."})
            if not config.exists(key):
                raise ValidationError(
                    {"detail": "The key {0} does not exist.", "args": [key]}
                )
            if not self.check_config_permission(key):
                self.permission_denied(request, message=key)
            if "value" not in entry:
                raise ValidationError(
                    {"detail": "Invalid input. Config value is missing."}
                )

        errors = {}
        for entry in request.data:
            try:
                config[entry["key"]] = entry["value"]
            except ConfigError as err:
                errors[entry["key"]] = str(err)

        return Response({"errors": errors})

    @list_route(methods=["post"])
    def reset_groups(self, request):
        """
        Resets multiple groups. The request data contains all
        (main) group names: [<group1>, ...]
        """
        if not isinstance(request.data, list):
            raise ValidationError("The data must be a list")
        for group in request.data:
            if not isinstance(group, str):
                raise ValidationError("Every group must be a string")

        for key, config_variable in config.config_variables.items():
            if (
                config_variable.group in request.data
                and config[key] != config_variable.default_value
            ):
                config[key] = config_variable.default_value

        return Response()


class ProjectorMessageViewSet(ModelViewSet):
    """
    API endpoint for messages.

    There are the following views: list, retrieve, create, update,
    partial_update and destroy.
    """

    access_permissions = ProjectorMessageAccessPermissions()
    queryset = ProjectorMessage.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ("create", "partial_update", "update", "destroy"):
            result = has_perm(self.request.user, "core.can_manage_projector")
        else:
            result = False
        return result


class CountdownViewSet(ModelViewSet):
    """
    API endpoint for Countdown.

    There are the following views: list, retrieve, create, update,
    partial_update and destroy.
    """

    access_permissions = CountdownAccessPermissions()
    queryset = Countdown.objects.all()

    def check_view_permissions(self):
        """
        Returns True if the user has required permissions.
        """
        if self.action in ("list", "retrieve"):
            result = self.get_access_permissions().check_permissions(self.request.user)
        elif self.action in ("create", "partial_update", "update", "destroy"):
            result = has_perm(self.request.user, "core.can_manage_projector")
        else:
            result = False
        return result


# Special API views


class ServerTime(utils_views.APIView):
    """
    Returns the server time as UNIX timestamp.
    """

    http_method_names = ["get"]

    def get_context_data(self, **context):
        return now().timestamp()


class VersionView(utils_views.APIView):
    """
    Returns a dictionary with the OpenSlides version and the version of all
    plugins.
    """

    http_method_names = ["get"]

    def get_context_data(self, **context):
        result: Dict[str, Any] = {
            "openslides_version": version,
            "openslides_license": license,
            "openslides_url": url,
            "plugins": [],
            "no_name_yet_users": User.objects.filter(last_login__isnull=False).count(),
        }
        # Versions of plugins.
        for plugin in settings.INSTALLED_PLUGINS:
            result["plugins"].append(
                {
                    "verbose_name": get_plugin_verbose_name(plugin),
                    "description": get_plugin_description(plugin),
                    "version": get_plugin_version(plugin),
                    "license": get_plugin_license(plugin),
                    "url": get_plugin_url(plugin),
                }
            )
        return result


class HistoryInformationView(utils_views.APIView):
    """
    View to retrieve information about OpenSlides history.

    Use GET to search history information. The query parameter 'type' determines
    the type of your search:

    Examples:

        /?type=element&value=motions%2Fmotion%3A42 if your search for motion 42

    Use DELETE to clear the history.
    """

    http_method_names = ["get", "delete"]

    def get_context_data(self, **context):
        """
        Checks permission and parses query parameters.
        """
        if not has_perm(self.request.user, "core.can_see_history"):
            self.permission_denied(self.request)
        type = self.request.query_params.get("type")
        value = self.request.query_params.get("value")
        if type not in ("element"):
            raise ValidationError(
                {"detail": "Invalid input. Type should be 'element' or 'text'."}
            )
        # We currently just support searching by element id.
        data = self.get_data_element_search(value)
        return data

    def get_data_element_search(self, value):
        """
        Retrieves history information for element search.
        """
        data = []
        for instance in History.objects.filter(element_id=value).order_by("-now"):
            if instance.information:
                data.append(
                    {
                        "element_id": instance.element_id,
                        "timestamp": instance.now.timestamp(),
                        "information": instance.information,
                        "user_id": instance.user.pk if instance.user else None,
                    }
                )
        return data

    def delete(self, request, *args, **kwargs):
        """
        Deletes and rebuilds the history.
        """
        # Check permission
        if not in_some_groups(request.user.pk or 0, [GROUP_ADMIN_PK]):
            self.permission_denied(request)

        # Delete history data and history (via CASCADE)
        HistoryData.objects.all().delete()

        # Rebuild history.
        History.objects.build_history()

        return Response({"detail": "History was deleted and rebuild successfully."})


class HistoryDataView(utils_views.APIView):
    """
    View to retrieve the history data of OpenSlides.

    Use query paramter timestamp (UNIX timestamp) to get all elements from begin
    until (including) this timestamp.
    """

    http_method_names = ["get"]

    def get_context_data(self, **context):
        """
        Checks if user is in admin group. If yes, all history data until
        (including) timestamp are collected to build a valid dataset for the client.
        """
        if not in_some_groups(self.request.user.pk or 0, [GROUP_ADMIN_PK]):
            self.permission_denied(self.request)
        try:
            timestamp = int(self.request.query_params.get("timestamp", 0))
        except ValueError:
            raise ValidationError(
                {"detail": "Invalid input. Timestamp should be an integer."}
            )
        queryset = History.objects.select_related("full_data")
        if timestamp:
            queryset = queryset.filter(
                now__lte=datetime.datetime.fromtimestamp(timestamp)
            )

        # collection <--> id <--> full_data
        dataset: Dict[str, Dict[int, Any]] = defaultdict(dict)
        for instance in queryset:
            collection, id = split_element_id(instance.element_id)
            full_data = instance.full_data.full_data
            if full_data:
                dataset[collection][id] = full_data
            elif id in dataset[collection]:
                del dataset[collection][id]

        # Ensure, that newer configs than the requested timepoint are also
        # included, so the client is happy and doesn't miss any config variables.
        all_current_config_keys = set(config.config_variables.keys())
        all_old_config_keys = set(
            map(lambda config: config["key"], dataset["core/config"].values())
        )
        missing_keys = all_current_config_keys - all_old_config_keys
        if missing_keys:
            config_full_data = async_to_sync(element_cache.get_collection_data)(
                "core/config"
            )
            key_to_id = config.get_key_to_id()
            for key in missing_keys:
                id = key_to_id[key]
                dataset["core/config"][id] = config_full_data[id]

        return {
            collection: list(dataset[collection].values())
            for collection in dataset.keys()
        }
