# -*- coding: utf-8 -*-

from django import forms
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _

from openslides.utils.template import Tab
from openslides.utils.views import FormView

from .api import config
from .signals import config_signal


class ConfigView(FormView):
    """
    The view for a config page.
    """
    template_name = 'config/config_form.html'
    config_page = None
    form_class = forms.Form

    def has_permission(self, *args, **kwargs):
        """
        Ensures that only users with tab's permission can see this view.
        """
        self.permission_required = self.config_page.required_permission
        return super(ConfigView, self).has_permission(*args, **kwargs)

    def get_form(self, *args):
        """
        Gets the form for the view. Includes all form fields given by the
        tab's config objects.
        """
        form = super(ConfigView, self).get_form(*args)
        for name, field in self.generate_form_fields_from_config_page():
            form.fields[name] = field
        return form

    def generate_form_fields_from_config_page(self):
        """
        Generates the fields for the get_form function.
        """
        for variable in self.config_page.variables:
            if variable.form_field is not None:
                yield (variable.name, variable.form_field)

    def get_initial(self):
        """
        Returns a dictonary with the actual values of the config variables
        as intial value for the form.
        """
        initial = super(ConfigView, self).get_initial()
        for variable in self.config_page.variables:
            initial.update({variable.name: config[variable.name]})
        return initial

    def get_context_data(self, **kwargs):
        """
        Adds to the context the active config tab, a list of dictionaries
        containing all config tabs each with a flag which is true if the
        tab is the active one and adds a flag whether the config page has
        groups. Adds also extra_stylefiles and extra_javascript.
        """
        context = super(ConfigView, self).get_context_data(**kwargs)

        context['active_config_page'] = self.config_page

        config_pages_list = []
        for receiver, config_page in config_signal.send(sender=self):
            if config_page.is_shown():
                config_pages_list.append({
                    'config_page': config_page,
                    'active': self.request.path == reverse('config_%s' % config_page.url)})
        context['config_pages_list'] = sorted(config_pages_list, key=lambda config_page_dict: config_page_dict['config_page'].weight)

        if hasattr(self.config_page, 'groups'):
            context['groups'] = self.config_page.groups
        else:
            context['groups'] = None

        if 'extra_stylefiles' in self.config_page.extra_context:
            if 'extra_stylefiles' in context:
                context['extra_stylefiles'].extend(self.config_page.extra_context['extra_stylefiles'])
            else:
                context['extra_stylefiles'] = self.config_page.extra_context['extra_stylefiles']

        if 'extra_javascript' in self.config_page.extra_context:
            if 'extra_javascript' in context:
                context['extra_javascript'].extend(self.config_page.extra_context['extra_javascript'])
            else:
                context['extra_javascript'] = self.config_page.extra_context['extra_javascript']

        return context

    def get_success_url(self):
        """
        Returns the success url when changes are saved. Here it is the same
        url as the tab.
        """
        return reverse('config_%s' % self.config_page.url)

    def form_valid(self, form):
        """
        Saves all data of a valid form.
        """
        for key in form.cleaned_data:
            config[key] = form.cleaned_data[key]
        messages.success(self.request, _('%s settings successfully saved.') % _(self.config_page.title))
        return super(ConfigView, self).form_valid(form)


def register_tab(request):
    """
    Registers the tab for this app in the main menu.
    """
    return Tab(
        title=_('Configuration'),
        app='config',
        url=reverse('config_first_config_page'),
        permission=request.user.has_perm('config.can_manage'),
        selected=request.path.startswith('/config/'))
