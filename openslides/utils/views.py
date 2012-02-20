try:
    import json
except ImportError:
    import simplejson as json

from django.conf import settings
from django.http import HttpResponseServerError, HttpResponse
from django.core.urlresolvers import reverse
from django.template import loader, RequestContext
from django.template.loader import render_to_string
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic import (TemplateView as _TemplateView,
                                  RedirectView as _RedirectView,
                                  UpdateView as _UpdateView,
                                  CreateView as _CreateView,)
from django.views.generic.detail import SingleObjectMixin

from utils import render_to_forbitten

FREE_TO_GO = 'free to go'


class LoginMixin(object):
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(LoginMixin, self).dispatch(request, *args, **kwargs)


class PermissionMixin(object):
    permission_required = FREE_TO_GO

    def dispatch(self, request, *args, **kwargs):
        if self.permission_required == FREE_TO_GO:
            has_permission = True
        else:
            has_permission = request.user.has_perm(self.permission_required)

        if has_permission:
            if request.user.is_authenticated():
                path = urlquote(request.get_full_path())
                return HttpResponseRedirect("%s?next=%s" % (settings.LOGIN_URL, path))
            else:
                return render_to_forbitten(request)
        return super(LoginMixin, self).dispatch(request, *args, **kwargs)


class TemplateView(_TemplateView, PermissionMixin):
    pass


class RedirectView(_RedirectView, PermissionMixin):
    permanent = False
    allow_ajax = False

    def pre_redirect(self, request, *args, **kwargs):
        pass

    def pre_post_redirect(self, request, *args, **kwargs):
        pass

    def get(self, request, *args, **kwargs):
        if request.method == 'GET':
            self.pre_redirect( request, *args, **kwargs)
        elif request.method == 'POST':
            self.pre_post_redirect(request, *args, **kwargs)

        if self.request.is_ajax() and self.allow_ajax:
            return HttpResponse(json.dumps(self.get_ajax_context(**kwargs)))
        return super(RedirectView, self).get(request, *args, **kwargs)

    def get_redirect_url(self, **kwargs):
        return reverse(super(RedirectView, self).get_redirect_url(**kwargs))

    def get_ajax_context(self, **kwargs):
        return {}


class UpdateView(_UpdateView, PermissionMixin):
    def get_success_url(self):
        if 'apply' in self.request.POST:
            return ''
        return reverse(super(UpdateView, self).get_success_url())


class CreateView(_CreateView, PermissionMixin):
    def get_success_url(self):
        if 'apply' in self.request.POST:
            return reverse('item_edit', args=[self.object.id])
        return reverse(super(CreateView, self).get_success_url())


class DeleteView(RedirectView, SingleObjectMixin):
    def pre_redirect(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.confirm_form(request, self.object)

    def pre_post_redirect(self, request, *args, **kwargs):
        pass


def server_error(request, template_name='500.html'):
    """
    500 error handler.

    Templates: `500.html`
    Context:
        MEDIA_URL
            Path of static media (e.g. "media.example.org")
    """
    t = loader.get_template("500.html") # You need to create a 500.html template.
    return HttpResponseServerError(render_to_string('500.html', context_instance=RequestContext(request)))
