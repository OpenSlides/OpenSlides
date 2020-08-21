import json
import logging

from django.contrib.auth import (
    get_user_model,
    login as auth_login,
    logout as auth_logout,
)
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseServerError
from django.views.generic import View
from onelogin.saml2.auth import OneLogin_Saml2_Auth
from onelogin.saml2.errors import OneLogin_Saml2_Error
from onelogin.saml2.utils import OneLogin_Saml2_Utils

from openslides.utils.autoupdate import inform_changed_data

from .settings import get_saml_settings


logger = logging.getLogger(__name__)


class SamlView(View):
    """
    View for the SAML Interface.
    Some SAML termina:
    - IDP: Identity provider. The service providing the actual login.
    - SP: Service provider. That is OpenSlides.
    """

    def __init__(self, *args, **kwargs):
        return super().__init__(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        """ POST requests should do the same as GET requests. """
        return self.get(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        """
        Switches specific saml types

        First user-initiated requests:
        - sso: SingleSignOn -> Redirect to IDP
        - sso2: Also SingleSingOn with a special redirect url
        - slo: SingleLogOut: Logs the user out of OpenSlides and the IDP.
               To only log out from OpenSlides, use the standard logout url.

        Second, requests from the IDP:
        - acs: AssertionConsumerService: Response from the IDP to the SP. Contains
               login data for a valid user
        - sls: SingleLogoutService: Request to log the user out.

        TODO: Nicer errors
        """
        url, auth = self.get_saml_auth(request)

        if "sso" in request.GET:
            return HttpResponseRedirect(auth.login())

        elif "sso2" in request.GET:
            return_to = url + "/"
            return HttpResponseRedirect(auth.login(return_to))

        elif "slo" in request.GET:
            name_id = request.session.get("samlNameId")
            session_index = request.session.get("samlSessionIndex")
            auth_logout(request)  # Logout from OpenSlides
            if name_id is None and session_index is None:
                # Not a SAML user
                return HttpResponseRedirect("/")
            else:
                request.session["samlNameId"] = None
                request.session["samlSessionIndex"] = None
                # Logout from IDP
                return HttpResponseRedirect(
                    auth.logout(name_id=name_id, session_index=session_index)
                )

        elif "acs" in request.GET:
            error_msg = ""
            try:
                auth.process_response()
                errors = auth.get_errors()
                if errors:
                    error_msg = "".join(errors)
            except OneLogin_Saml2_Error as e:
                auth_errors = auth.get_errors()
                if auth_errors:
                    auth_errors = "".join(auth_errors)
                    error_msg = f"auth: {auth_errors}, "
                error_msg += f"detail: {str(e)}, code: {e.code}"

            if error_msg:
                return HttpResponseServerError(content=error_msg)

            request.session["samlNameId"] = auth.get_nameid()
            request.session["samlSessionIndex"] = auth.get_session_index()
            self.login_user(request, auth.get_attributes())

            if "RelayState" in request.POST and url != request.POST["RelayState"]:
                return HttpResponseRedirect(
                    auth.redirect_to(request.POST["RelayState"])
                )
            else:
                return HttpResponseRedirect("/")

        elif "sls" in request.GET:
            error_msg = ""
            try:
                url = auth.process_slo(
                    delete_session_cb=lambda: request.session.flush()
                )
                errors = auth.get_errors()
                if errors:
                    error_msg = "".join(errors)
            except OneLogin_Saml2_Error as e:
                auth_errors = auth.get_errors()
                if auth_errors:
                    auth_errors = "".join(auth_errors)
                    error_msg = f"auth: {auth_errors}, "
                error_msg += f"detail: {str(e)}, code: {e.code}"

            if error_msg:
                return HttpResponseServerError(content=error_msg)
            else:
                return HttpResponseRedirect(url or "/")

        else:
            return HttpResponseRedirect("/")

    def login_user(self, request, attributes):
        """
        Logs in a user given by the attributes
        """
        verbose_attrs = ", ".join(attributes.keys())
        logger.info(f"Login saml user with these attributes: {verbose_attrs}")

        # Get arguments for querying the one user
        queryargs = self.get_queryargs(attributes)
        User = get_user_model()
        user, created = User.objects.get_or_create(**queryargs)
        if created:
            logger.info(
                f"Created new saml user with id {user.id} and username {user.username}"
            )
            group_ids = get_saml_settings().default_group_ids
            if group_ids:
                user.groups.add(*group_ids)
            inform_changed_data(user)  # put the new user into the cache
        else:
            logger.info(
                f"Found saml user with id {user.id} and username {user.username}"
            )
            self.update_user(user, queryargs["defaults"])
        auth_login(request, user)

    def get_queryargs(self, attributes):
        """
        Build the arguments for getting or creating a user
        attributes with lookup=True are "normal" queryargs.
        The rest are default values. Ensures the auth_type
        to be "saml".
        """
        queryargs = {}
        defaults = {}
        mapping = get_saml_settings().attribute_mapping
        for key, (value, lookup) in mapping.items():
            attribute = attributes.get(key)
            if isinstance(attribute, list):
                attribute = ", ".join(attribute)

            if lookup:
                queryargs[value] = attribute
            else:
                defaults[value] = attribute

        # Add the auth_type to the defaults:
        defaults["auth_type"] = "saml"

        queryargs["defaults"] = defaults
        verbose_queryargs = json.dumps(queryargs)
        logger.debug(f"User queryargs: {verbose_queryargs}")
        return queryargs

    def update_user(self, user, attributes):
        """ Updates a user with the new attributes """
        if "auth_type" in attributes:
            del attributes["auth_type"]

        changed = False
        for key, value in attributes.items():
            user_attr = getattr(user, key)
            if user_attr != value:
                setattr(user, key, value)
                changed = True
        if changed:
            user.save()

    def get_saml_auth(self, request):
        saml_request = dict(get_saml_settings().request_settings)
        # Update not existing keys
        saml_request["https"] = saml_request.get(
            "https", "on" if request.is_secure() else "off"
        )
        saml_request["http_host"] = saml_request.get(
            "http_host", request.META["HTTP_HOST"]
        )
        saml_request["script_name"] = saml_request.get(
            "script_name", request.META["PATH_INFO"]
        )
        saml_request["server_port"] = saml_request.get(
            "server_port", request.META["SERVER_PORT"]
        )
        # add get and post data
        saml_request["get_data"] = request.GET.copy()
        saml_request["post_data"] = request.POST.copy()
        return (
            OneLogin_Saml2_Utils.get_self_url(saml_request),
            OneLogin_Saml2_Auth(saml_request, get_saml_settings().saml_settings),
        )


def serve_metadata(request, *args, **kwargs):
    settings = get_saml_settings().saml_settings
    metadata = settings.get_sp_metadata()
    errors = settings.validate_metadata(metadata)

    if len(errors) > 0:
        return HttpResponseServerError(content=", ".join(errors))
    else:
        return HttpResponse(content=metadata, content_type="text/xml")
