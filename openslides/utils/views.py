try:
    import json
except ImportError:
    import simplejson as json

try:
    from cStringIO import StringIO
except ImportError:
    from StringIO import StringIO

from reportlab.platypus import SimpleDocTemplate, Paragraph, Frame, PageBreak, Spacer, Table, LongTable, TableStyle, Image
from reportlab.lib.units import cm

from django.conf import settings
from django.contrib import messages
from django.utils.translation import ugettext as _
from django.http import HttpResponseServerError, HttpResponse
from django.core.urlresolvers import reverse
from django.template import loader, RequestContext
from django.template.loader import render_to_string
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.generic import (
    TemplateView as _TemplateView,
    RedirectView as _RedirectView,
    UpdateView as _UpdateView,
    CreateView as _CreateView,
    View,
    FormView as _FormView,
)

from django.views.generic.detail import SingleObjectMixin

from utils import render_to_forbitten
from openslides.utils.signals import template_manipulation
from pdf import firstPage, laterPages

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
    def get_context_data(self, **kwargs):
        context = super(TemplateView, self).get_context_data(**kwargs)
        template_manipulation.send(sender=self, context=context)
        return context


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


class FormView(_FormView, PermissionMixin):
    def get_success_url(self):
        if not self.success_url:
            return ''
        return reverse(super(FormView, self).get_success_url())

    def get_context_data(self, **kwargs):
        context = super(FormView, self).get_context_data(**kwargs)
        template_manipulation.send(sender=self, request=self.request, context=context)
        return context

    def form_invalid(self, form):
        messages.error(self.request, _('Please check the form for errors.'))
        return super(FormView, self).form_invalid(form)


class UpdateView(_UpdateView, PermissionMixin):
    def get_success_url(self):
        if 'apply' in self.request.POST:
            return ''
        return reverse(super(UpdateView, self).get_success_url())

    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)
        template_manipulation.send(sender=self, context=context)
        return context


class CreateView(_CreateView, PermissionMixin):
    def get_success_url(self):
        if 'apply' in self.request.POST:
            return reverse('item_edit', args=[self.object.id])
        return reverse(super(CreateView, self).get_success_url())


class DeleteView(RedirectView, SingleObjectMixin):
    def pre_redirect(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.confirm_form(request, self.object)


class PDFView(View, PermissionMixin):
    filename = 'No_Name'

    def render_to_response(self, filename):
        response = HttpResponse(mimetype='application/pdf')
        filename = u'filename=%s.pdf;' % filename
        response['Content-Disposition'] = filename.encode('utf-8')

        buffer = StringIO()
        pdf_document = SimpleDocTemplate(buffer)
        story = [Spacer(1,3*cm)]

        self.append_to_pdf(story)

        pdf_document.build(story, onFirstPage=firstPage, onLaterPages=laterPages)

        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        return response

    def append_to_pdf(self, story):
        pass

    def get_filename(self):
        return self.filename

    def get(self, request, *args, **kwargs):
        return self.render_to_response(self.get_filename())


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
