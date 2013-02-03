#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.views
    ~~~~~~~~~~~~~~~~~~~~~~

    Views for OpenSlides.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import json
from cStringIO import StringIO
from reportlab.platypus import SimpleDocTemplate, Spacer
from reportlab.lib.units import cm

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.context_processors import csrf
from django.core.exceptions import ImproperlyConfigured
from django.core.urlresolvers import reverse
from django.conf import settings
from django.dispatch import receiver
from django.http import HttpResponseServerError, HttpResponse, HttpResponseRedirect
from django.utils.decorators import method_decorator
from django.utils.translation import ugettext as _, ugettext_lazy
from django.utils.importlib import import_module
from django.template import RequestContext
from django.template.loader import render_to_string
from django.views.generic import (
    TemplateView as _TemplateView,
    RedirectView as _RedirectView,
    UpdateView as _UpdateView,
    CreateView as _CreateView,
    View as _View,
    FormView as _FormView,
    ListView as _ListView,
    DetailView as _DetailView,
)
from django.views.generic.detail import SingleObjectMixin
from django.views.generic.list import TemplateResponseMixin

from openslides.utils.utils import render_to_forbidden, html_strong
from openslides.utils.signals import template_manipulation
from openslides.utils.pdf import firstPage, laterPages


NO_PERMISSION_REQUIRED = 'No permission required'

View = _View


class SetCookieMixin(object):
    def render_to_response(self, context, **response_kwargs):
        response = TemplateResponseMixin.render_to_response(
            self, context, **response_kwargs)
        if 'cookie' in context:
            response.set_cookie(context['cookie'][0], context['cookie'][1])
        return response


class LoginMixin(object):
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        return super(LoginMixin, self).dispatch(request, *args, **kwargs)


class PermissionMixin(object):
    permission_required = NO_PERMISSION_REQUIRED

    def has_permission(self, request, *args, **kwargs):
        if self.permission_required == NO_PERMISSION_REQUIRED:
            return True
        else:
            return request.user.has_perm(self.permission_required)

    def dispatch(self, request, *args, **kwargs):
        if not self.has_permission(request, *args, **kwargs):
            if not request.user.is_authenticated():
                path = request.get_full_path()
                return HttpResponseRedirect(
                    "%s?next=%s" % (settings.LOGIN_URL, path))
            else:
                return render_to_forbidden(request)
        return _View.dispatch(self, request, *args, **kwargs)


class AjaxMixin(object):
    def get_ajax_context(self, **kwargs):
        return {}

    def ajax_get(self, request, *args, **kwargs):
        return HttpResponse(json.dumps(self.get_ajax_context(**kwargs)))


class ExtraContextMixin(object):
    def get_context_data(self, **kwargs):
        context = super(ExtraContextMixin, self).get_context_data(**kwargs)
        template_manipulation.send(
            sender=self.__class__, request=self.request, context=context)
        return context


class UrlMixin(object):
    apply_url_name = None
    success_url_name = None
    success_url = None
    apply_url = None

    def get_apply_url(self):
        if self.apply_url_name:
            return reverse(self.apply_url_name, args=self.get_url_name_args())
        elif self.apply_url:
            return self.apply_url
        else:
            try:
                return self.object.get_absolute_url('edit')
            except AttributeError:
                raise ImproperlyConfigured(
                    "No URL to redirect to. Provide an apply_url_name.")

    def get_success_url(self):
        if 'apply' in self.request.POST:
            return self.get_apply_url()

        if self.success_url_name:
            return reverse(self.success_url_name, args=self.get_url_name_args())
        elif self.success_url:
            return self.success_url
        else:
            try:
                return self.object.get_absolute_url()
            except AttributeError:
                raise ImproperlyConfigured(
                    "No URL to redirect to.  Either provide a url or define"
                    " a get_absolute_url method on the Model.")

    def get_url_name_args(self):
        return []


class QuestionMixin(object):
    question = ugettext_lazy('Are you sure?')
    success_message = ugettext_lazy('Thank you for your answer')
    answer_options = [('yes', ugettext_lazy("Yes")), ('no', ugettext_lazy("No"))]
    question_url_name = None
    success_url_name = None

    def get_redirect_url(self, **kwargs):
        if self.request.method == 'GET':
            return reverse(self.question_url_name, args=self.get_url_name_args())
        else:
            return reverse(self.success_url_name, args=self.get_url_name_args())

    def get_url_name_args(self):
        return []

    def pre_redirect(self, request, *args, **kwargs):
        # Prints the question in a GET request
        self.confirm_form()

    def get_question(self):
        return unicode(self.question)

    def get_answer_options(self):
        return self.answer_options

    def get_answer_url(self):
        try:
            return self.answer_url
        except AttributeError:
            return self.request.path

    def confirm_form(self):
        option_fields = "\n".join([
            '<button type="submit" class="btn btn-mini" name="%s">%s</button>' % (option[0], unicode(option[1]))
            for option in self.get_answer_options()])
        messages.warning(
            self.request,
            """
            %(message)s
            <form action="%(url)s" method="post">
                <input type="hidden" value="%(csrf)s" name="csrfmiddlewaretoken">
                %(option_fields)s
            </form>
            """ % {'message': self.get_question(),
                   'url': self.get_answer_url(),
                   'csrf': csrf(self.request)['csrf_token'],
                   'option_fields': option_fields})

    def pre_post_redirect(self, request, *args, **kwargs):
        # Reacts on the response of the user in a POST-request.
        # TODO: call the methodes for all possible answers.
        if self.get_answer() == 'yes':
            self.case_yes()
            messages.success(request, self.get_success_message())

    def get_answer(self):
        for option in self.get_answer_options():
            if option[0] in self.request.POST:
                return option[0]
        return None

    def case_yes(self):
        # TODO: raise a warning
        pass

    def get_success_message(self):
        return self.success_message


class TemplateView(PermissionMixin, ExtraContextMixin, _TemplateView):
    pass


class ListView(PermissionMixin, SetCookieMixin, ExtraContextMixin, _ListView):
    pass


class AjaxView(PermissionMixin, AjaxMixin, View):
    def get(self, request, *args, **kwargs):
        return self.ajax_get(request, *args, **kwargs)


class RedirectView(PermissionMixin, AjaxMixin, _RedirectView):
    permanent = False
    allow_ajax = False
    url_name = None

    def pre_redirect(self, request, *args, **kwargs):
        pass

    def pre_post_redirect(self, request, *args, **kwargs):
        pass

    def get(self, request, *args, **kwargs):
        if request.method == 'GET':
            self.pre_redirect(request, *args, **kwargs)
        elif request.method == 'POST':
            self.pre_post_redirect(request, *args, **kwargs)

        if self.request.is_ajax() and self.allow_ajax:
            return self.ajax_get(request, *args, **kwargs)
        return super(RedirectView, self).get(request, *args, **kwargs)

    def get_redirect_url(self, **kwargs):
        if self.url_name is not None:
            return reverse(self.url_name, args=self.get_url_name_args())
        else:
            return super(RedirectView, self).get_redirect_url(**kwargs)

    def get_url_name_args(self):
        return []


class FormView(PermissionMixin, ExtraContextMixin, UrlMixin, _FormView):
    def form_invalid(self, form):
        messages.error(self.request, _('Please check the form for errors.'))
        return super(FormView, self).form_invalid(form)


class ModelFormMixin(object):
    def form_valid(self, form):
        self.object = form.save(commit=False)
        self.manipulate_object(form)
        self.object.save()
        self.post_save(form)
        return HttpResponseRedirect(self.get_success_url())

    def manipulate_object(self, form):
        pass

    def post_save(self, form):
        form.save_m2m()


class UpdateView(PermissionMixin, UrlMixin, ExtraContextMixin,
                 ModelFormMixin, _UpdateView):
    def form_invalid(self, form):
        messages.error(self.request, _('Please check the form for errors.'))
        return super(UpdateView, self).form_invalid(form)

    def get_success_message(self):
        return _('%s was successfully modified.') % html_strong(self.object)


class CreateView(PermissionMixin, UrlMixin, ExtraContextMixin,
                 ModelFormMixin, _CreateView):
    def form_invalid(self, form):
        messages.error(self.request, _('Please check the form for errors.'))
        return super(CreateView, self).form_invalid(form)

    def get_success_message(self):
        return _('%s was successfully created.') % html_strong(self.object)


class DeleteView(SingleObjectMixin, QuestionMixin, RedirectView):
    question_url_name = None
    success_url_name = None

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        return super(DeleteView, self).get(request, *args, **kwargs)

    def get_redirect_url(self, **kwargs):
        if self.request.method == 'GET' and self.question_url_name is None:
            return self.object.get_absolute_url()
        else:
            return super(DeleteView, self).get_redirect_url(**kwargs)

    def get_question(self):
        return _('Do you really want to delete %s?') % html_strong(self.object)

    def case_yes(self):
        self.object.delete()

    def get_success_message(self):
        return _('%s was successfully deleted.') % html_strong(self.object)


class DetailView(PermissionMixin, ExtraContextMixin, _DetailView):
    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        return super(DetailView, self).get(request, *args, **kwargs)


class PDFView(PermissionMixin, View):
    filename = _('undefined-filename')
    top_space = 3
    document_title = None

    def get_top_space(self):
        return self.top_space

    def get_document_title(self):
        if self.document_title:
            return unicode(self.document_title)
        else:
            return ''

    def get_filename(self):
        return self.filename

    def get_template(self, buffer):
        return SimpleDocTemplate(buffer)

    def build_document(self, pdf_document, story):
        pdf_document.build(
            story, onFirstPage=firstPage, onLaterPages=laterPages)

    def render_to_response(self, filename):
        response = HttpResponse(mimetype='application/pdf')
        filename = u'filename=%s.pdf;' % self.get_filename()
        response['Content-Disposition'] = filename.encode('utf-8')

        buffer = StringIO()
        pdf_document = self.get_template(buffer)
        pdf_document.title = self.get_document_title()
        story = [Spacer(1, self.get_top_space() * cm)]

        self.append_to_pdf(story)

        self.build_document(pdf_document, story)

        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

    def get(self, request, *args, **kwargs):
        return self.render_to_response(self.get_filename())


def server_error(request, template_name='500.html'):
    """
    500 error handler.

    Templates: `500.html`
    """
    return HttpResponseServerError(render_to_string(
        template_name, context_instance=RequestContext(request)))


@receiver(template_manipulation, dispatch_uid="send_register_tab")
def send_register_tab(sender, request, context, **kwargs):
    tabs = []
    for app in settings.INSTALLED_APPS:
        try:
            mod = import_module(app + '.views')
            tabs.append(mod.register_tab(request))
        except (ImportError, AttributeError):
            continue

    context.update({
        'tabs': tabs,
    })
