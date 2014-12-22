from django.http import HttpResponse

from openslides.utils import views

from .models import DummyModel


class GetAbsoluteUrl(object):
    """
    Generates objects with a get_absolute_url method.

    Helper Class for the tests.
    """
    def get_absolute_url(self, link='default'):
        if link == 'detail':
            url = 'detail_url'
        elif link == 'update':
            url = 'update_url'
        elif link == 'default':
            url = 'default_url'
        return url


class LoginMixinView(views.LoginMixin, views.View):
    def get(self, *args, **kwargs):
        response = HttpResponse('Well done.')
        response.status_code = 200
        return response


class PermissionMixinView(views.PermissionMixin, views.View):
    def get(self, *args, **kwargs):
        response = HttpResponse('Well done.')
        response.status_code = 200
        return response


class AjaxMixinView(views.AjaxMixin, views.View):
    def get_ajax_context(self, **kwargs):
        return super(AjaxMixinView, self).get_ajax_context(
            new_context='newer_context', **kwargs)


class UrlMixinView(views.UrlMixin, views.View):
    pass


class UrlMixinViewWithObject(views.UrlMixin, views.View):
    object = GetAbsoluteUrl()


class DummyDetailView(views.DetailView):
    model = DummyModel

    def get_context_data(self, **context):
        context = super(DummyDetailView, self).get_context_data(**context)
        # Just call get_object() some times to test the cache
        self.get_object()
        self.get_object()
        self.get_object()
        return context
