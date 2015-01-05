# -*- coding: utf-8 -*-

import json
from cStringIO import StringIO

from django.conf import settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.context_processors import csrf
from django.core.exceptions import ImproperlyConfigured, PermissionDenied
from django.core.urlresolvers import reverse
from django.http import (HttpResponse, HttpResponseRedirect)
from django.utils.decorators import method_decorator
from django.utils.translation import ugettext as _
from django.utils.translation import ugettext_lazy
from django.views import generic as django_views
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Spacer

from .exceptions import OpenSlidesError
from .forms import CSVImportForm
from .pdf import firstPage, laterPages
from .signals import template_manipulation
from .utils import html_strong

View = django_views.View


class LoginMixin(object):
    """
    Mixin for Views, that only can be viseted from users how are logedin.
    """

    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        """
        Check if the user is loged in.
        """
        return super(LoginMixin, self).dispatch(request, *args, **kwargs)


class PermissionMixin(object):
    """
    Mixin for views, that only can be visited from users with special
    permissions.

    Set the attribute 'required_permission' to the required permission
    string or override the method 'check_permission'.
    """
    required_permission = None

    def check_permission(self, request, *args, **kwargs):
        """
        Checks if the user has the required permission.
        """
        if self.required_permission is None:
            return True
        else:
            return request.user.has_perm(self.required_permission)

    def dispatch(self, request, *args, **kwargs):
        """
        Check if the user has the permission.

        If the user is not logged in, redirect the user to the login page.
        """
        if not self.check_permission(request, *args, **kwargs):
            if not request.user.is_authenticated():
                path = request.get_full_path()
                return HttpResponseRedirect(
                    "%s?next=%s" % (settings.LOGIN_URL, path))
            else:
                raise PermissionDenied
        return super(PermissionMixin, self).dispatch(request, *args, **kwargs)


class AjaxMixin(object):
    """
    Mixin to response to an ajax request with an json object.
    """

    def get_ajax_context(self, **kwargs):
        """
        Returns a dictonary with the context for the ajax response.
        """
        return kwargs

    def ajax_get(self, request, *args, **kwargs):
        """
        Returns the HttpResponse.
        """
        return HttpResponse(json.dumps(self.get_ajax_context()))


class ExtraContextMixin(object):
    """
    Mixin to send the signal 'template_manipulation' to add extra content to the
    context of the view.

    For example this is used to add the main menu of openslides.
    """

    def get_context_data(self, **kwargs):
        """
        Sends the signal.
        """
        context = super(ExtraContextMixin, self).get_context_data(**kwargs)
        template_manipulation.send(
            sender=self.__class__, request=self.request, context=context)
        return context


class UrlMixin(object):
    url_name_args = None

    def get_url(self, url_name=None, url=None, args=None, use_absolute_url_link=None):
        """
        Returns an url.

        Tries
        1. to use the reverse for the attribute 'url_name',
        2. to use the attribute 'url' or
        3. to use self.object.get_absolute_url().

        Uses the attribute 'use_absolute_url_link' as argument for
        get_absolute_url in the third step. If the attribute is 'None' then
        the default value of get_absolute_url is used.

        Raises ImproperlyConfigured if no url can be found.
        """
        if url_name:
            value = reverse(url_name, args=args or [])
        elif url:
            value = url
        else:
            try:
                if use_absolute_url_link is None:
                    value = self.object.get_absolute_url()
                else:
                    value = self.object.get_absolute_url(use_absolute_url_link)
            except AttributeError:
                raise ImproperlyConfigured(
                    'No url to redirect to. See openslides.utils.views.UrlMixin '
                    'for more details.')
        return value

    def get_url_name_args(self):
        """
        Returns the arguments for the url name.

        Default is an empty list or [self.object.pk] if this exist.
        """
        if self.url_name_args is not None:
            value = self.url_name_args
        else:
            try:
                pk = self.object.pk
            except AttributeError:
                value = []
            else:
                if pk:
                    value = [pk]
                else:
                    value = []
        return value


class SingleObjectMixin(django_views.detail.SingleObjectMixin):
    """
    Mixin for single objects from the database.
    """

    def dispatch(self, *args, **kwargs):
        if not hasattr(self, 'object'):
            # Save the object not only in the cache but in the public
            # attribute self.object because Django expects this later.
            # Because get_object() has an internal cache this line is not a
            # performance problem.
            self.object = self.get_object()
        return super(SingleObjectMixin, self).dispatch(*args, **kwargs)

    def get_object(self, *args, **kwargs):
        """
        Returns the single object from database or cache.
        """
        try:
            obj = self._object
        except AttributeError:
            obj = super(SingleObjectMixin, self).get_object(*args, **kwargs)
            self._object = obj
        return obj


class FormMixin(UrlMixin):
    """
    Mixin for views with forms.
    """

    use_apply = True
    success_url_name = None
    success_url = None
    success_message = None
    apply_url_name = None
    apply_url = None
    error_message = ugettext_lazy('Please check the form for errors.')

    def get_apply_url(self):
        """
        Returns the url when the user clicks on 'apply'.
        """
        return self.get_url(self.apply_url_name, self.apply_url,
                            args=self.get_url_name_args(),
                            use_absolute_url_link='update')

    def get_success_url(self):
        """
        Returns the url when the user submits a form.

        Redirects to get_apply_url if self.use_apply is True
        """
        if self.use_apply and 'apply' in self.request.POST:
            value = self.get_apply_url()
        else:
            value = self.get_url(self.success_url_name, self.success_url,
                                 args=self.get_url_name_args())
        return value

    def form_valid(self, form):
        value = super(FormMixin, self).form_valid(form)
        messages.success(self.request, self.get_success_message())
        return value

    def form_invalid(self, form):
        value = super(FormMixin, self).form_invalid(form)
        messages.error(self.request, self.get_error_message())
        return value

    def get_success_message(self):
        return self.success_message

    def get_error_message(self):
        return self.error_message


class ModelFormMixin(FormMixin):
    """
    Mixin for FormViews.
    """

    def form_valid(self, form):
        """
        Called if the form is valid.

        1. saves the form into the model,
        2. calls 'self.manipulate_object,
        3. saves the object in the database,
        4. calls self.post_save.
        """
        self.object = form.save(commit=False)
        self.manipulate_object(form)
        self.object.save()
        self.post_save(form)
        messages.success(self.request, self.get_success_message())
        return HttpResponseRedirect(self.get_success_url())

    def manipulate_object(self, form):
        """
        Called before the object is saved into the database.
        """
        pass

    def post_save(self, form):
        """
        Called after the object is saved into the database.
        """
        form.save_m2m()


class TemplateView(PermissionMixin, ExtraContextMixin, django_views.TemplateView):
    """
    View to return with an template.
    """
    pass


class ListView(PermissionMixin, ExtraContextMixin, django_views.ListView):
    """
    View to show a list of model objects.
    """
    pass


class AjaxView(PermissionMixin, AjaxMixin, View):
    """
    View for ajax requests.
    """
    def get(self, request, *args, **kwargs):
        # TODO: Raise an error, if the request is not an ajax-request
        return self.ajax_get(request, *args, **kwargs)

    def post(self, *args, **kwargs):
        return self.get(*args, **kwargs)


class RedirectView(PermissionMixin, AjaxMixin, UrlMixin, django_views.RedirectView):
    """
    View to redirect to another url.

    The initial value of url_name_args is None, but the default given by
    the used get_url_name_args method is [self.object.pk] if it exist, else
    an empty list. Set url_name_args to an empty list, if you use an url
    name which does not need any arguments.
    """
    permanent = False
    allow_ajax = False
    url_name = None

    def pre_redirect(self, request, *args, **kwargs):
        """
        Called before the redirect.
        """
        # TODO: Also call this method on post-request.
        #       Add pre_get_redirect for get requests.
        pass

    def pre_post_redirect(self, request, *args, **kwargs):
        """
        Called before the redirect, if it is a post request.
        """
        pass

    def get(self, request, *args, **kwargs):
        if request.method == 'GET':
            self.pre_redirect(request, *args, **kwargs)
        elif request.method == 'POST':
            self.pre_post_redirect(request, *args, **kwargs)

        if request.is_ajax() and self.allow_ajax:
            return self.ajax_get(request, *args, **kwargs)
        return super(RedirectView, self).get(request, *args, **kwargs)

    def get_redirect_url(self, **kwargs):
        """
        Returns the url to which the redirect should go.
        """
        return self.get_url(self.url_name, self.url,
                            args=self.get_url_name_args())


class QuestionView(RedirectView):
    """
    Mixin for questions to the requesting user.

    The BaseView has to be a RedirectView.
    """

    question_message = ugettext_lazy('Are you sure?')
    final_message = ugettext_lazy('Thank you for your answer.')
    answer_options = [('yes', ugettext_lazy("Yes")), ('no', ugettext_lazy("No"))]
    question_url_name = None
    question_url = None

    def get_redirect_url(self, **kwargs):
        """
        Returns the url to which the view should redirect.
        """
        if self.request.method == 'GET':
            url = self.get_url(self.question_url_name, self.question_url,
                               args=self.get_url_name_args())
        else:
            url = super(QuestionView, self).get_redirect_url()
        return url

    def pre_redirect(self, request, *args, **kwargs):
        """
        Prints the question in a GET request.
        """
        self.confirm_form()

    def get_question_message(self):
        """
        Returns the question.
        """
        return unicode(self.question_message)

    def get_answer_options(self):
        """
        Returns the possible answers.

        This is a list of tubles. The first element of the tuble is the key,
        the second element is shown to the user.
        """
        return self.answer_options

    def confirm_form(self):
        """
        Returns the form to show in the message.
        """
        option_fields = "\n".join([
            '<button type="submit" class="btn btn-mini" name="%s">%s</button>'
            % (option[0], unicode(option[1]))
            for option in self.get_answer_options()])
        messages.warning(
            self.request,
            '%(message)s<form action="%(url)s" method="post">'
            '<input type="hidden" value="%(csrf)s" name="csrfmiddlewaretoken">'
            '%(option_fields)s</form>' % {
                'message': self.get_question_message(),
                'url': self.request.path,
                'csrf': csrf(self.request)['csrf_token'],
                'option_fields': option_fields})

    def pre_post_redirect(self, request, *args, **kwargs):
        """
        Calls the method for the answer the user clicked.

        The method name is on_clicked_ANSWER where ANSWER is the key from
        the clicked answer. See get_answer_options. Prints an error
        message, if no valid answer was given. If this method is not
        defined, nothing happens, else it is called and the success message
        is printed to the user.
        """
        try:
            answer = self.get_answer()
        except OpenSlidesError as error:
            messages.error(self.request, error)
        else:
            method_name = 'on_clicked_%s' % answer
            method = getattr(self, method_name, None)
            if method is None:
                pass
            else:
                method()
                self.create_final_message()

    def get_answer(self):
        """
        Returns the key of the clicked answer.

        Raises OpenSlidesError if the answer is not one of get_answer_options.
        """
        for option_key, option_name in self.get_answer_options():
            if option_key in self.request.POST:
                answer = option_key
                break
        else:
            raise OpenSlidesError(ugettext_lazy('You did not send a valid answer.'))
        return answer

    def get_final_message(self):
        """
        Returns the message to show after the action.

        Uses the attribute 'final_messsage' as default
        """
        return self.final_message

    def create_final_message(self):
        """
        Creates a message.
        """
        messages.success(self.request, self.get_final_message())


class FormView(PermissionMixin, ExtraContextMixin, FormMixin,
               django_views.FormView):
    """
    View for forms.
    """
    pass


class UpdateView(PermissionMixin, ExtraContextMixin,
                 ModelFormMixin, SingleObjectMixin, django_views.UpdateView):
    """
    View to update an model object.
    """

    def get_success_message(self):
        if self.success_message is None:
            message = _('%s was successfully modified.') % html_strong(self.get_object())
        else:
            message = self.success_message
        return message


class CreateView(PermissionMixin, ExtraContextMixin,
                 ModelFormMixin, django_views.CreateView):
    """
    View to create a model object.

    Note: This class has a django method get_object() which is different form
          the method in openslides.utils.views.SingleObjectMixin. The result
          is not cached.
    """

    def get_success_message(self):
        if self.success_message is None:
            message = _('%s was successfully created.') % html_strong(self.object)
        else:
            message = self.success_message
        return message


class DeleteView(SingleObjectMixin, QuestionView):
    """
    View to delete an model object.
    """

    success_url = None
    success_url_name = None

    def get_redirect_url(self, **kwargs):
        """
        Returns the url on which the delete dialog is shown and the url after
        the deleting.

        On GET-requests and on aborted or failed POST-requests, redirects to the detail
        view as default. The attributes question_url_name or question_url can
        define other urls.
        """
        if self.request.method == 'POST':
            try:
                answer = self.get_answer()
            except OpenSlidesError:
                answer = 'no'
            if answer == 'no':
                url = self.get_url(self.question_url_name, self.question_url,
                                   args=self.get_url_name_args())
            else:
                url = self.get_url(self.success_url_name, self.success_url,
                                   args=self.get_url_name_args())
        else:
            url = self.get_url(self.question_url_name, self.question_url,
                               args=self.get_url_name_args())
        return url

    def get_question_message(self):
        """
        Returns the question for the delete dialog.
        """
        return _('Do you really want to delete %s?') % html_strong(self.get_object())

    def on_clicked_yes(self):
        """
        Deletes the object.
        """
        self.get_object().delete()

    def get_final_message(self):
        """
        Prints the success message to the user.
        """
        return _('%s was successfully deleted.') % html_strong(self.get_object())


class DetailView(PermissionMixin, ExtraContextMixin, SingleObjectMixin, django_views.DetailView):
    """
    View to show an model object.
    """
    pass


class PDFView(PermissionMixin, View):
    """
    View to generate an PDF.
    """

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
        response = HttpResponse(content_type='application/pdf')
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


class CSVImportView(FormView):
    """
    View for a csv import of some data.

    The attribute import_function might to be a staticmethod.
    """
    form_class = CSVImportForm
    import_function = None

    def get_import_function(self):
        """
        Override this to return a specific function to import data from
        a given csv file using some extra kwargs. This function has to
        return a three-tuple of strings which are the messages for the
        user.

        Example function:

        def my_import(csvfile, **kwargs):
            # Parse file and import data
            return success_message, warning_message, error_message
        """
        if self.import_function is None:
            raise NotImplementedError('A CSVImportView must provide an import_function '
                                      'attribute or override a get_import_function method.')
        return self.import_function

    def form_valid(self, form):
        success, warning, error = self.get_import_function()(**form.cleaned_data)
        messages.success(self.request, success)
        messages.warning(self.request, warning)
        messages.error(self.request, error)
        return super(CSVImportView, self).form_valid(form)
