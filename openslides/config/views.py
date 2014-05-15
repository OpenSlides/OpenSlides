# -*- coding: utf-8 -*-

from django import forms
from django.contrib import messages
from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _

from openslides.utils.views import FormView

from .api import config
from .signals import config_signal


class ConfigView(FormView):
    """
    The view for a config collection.
    """
    required_permission = 'config.can_manage'
    template_name = 'config/config_form.html'
    config_collection = None
    form_class = forms.Form

    def get_form(self, *args):
        """
        Gets the form for the view. Includes all form fields given by the
        config collection.
        """
        form = super(ConfigView, self).get_form(*args)
        for name, field in self.generate_form_fields_from_config_collection():
            form.fields[name] = field
        return form

    def generate_form_fields_from_config_collection(self):
        """
        Generates the fields for the get_form function.
        """
        for variable in self.config_collection.variables:
            if variable.form_field is not None:
                yield (variable.name, variable.form_field)

    def get_initial(self):
        """
        Returns a dictonary with the actual values of the config variables
        as intial value for the form.
        """
        initial = super(ConfigView, self).get_initial()
        for variable in self.config_collection.variables:
            initial.update({variable.name: config[variable.name]})
        return initial

    def get_context_data(self, **kwargs):
        """
        Adds to the context the active config view, a list of dictionaries
        containing all config collections each with a flag which is true if its
        view is the active one and adds a flag whether the config collection
        has groups. Adds also extra_stylefiles and extra_javascript.
        """
        context = super(ConfigView, self).get_context_data(**kwargs)

        context['active_config_collection_view'] = self.config_collection

        config_collection_list = []
        for receiver, config_collection in config_signal.send(sender=self):
            if config_collection.is_shown():
                config_collection_list.append({
                    'config_collection': config_collection,
                    'active': self.request.path == reverse('config_%s' % config_collection.url)})
        context['config_collection_list'] = sorted(
            config_collection_list, key=lambda config_collection_dict: config_collection_dict['config_collection'].weight)

        if hasattr(self.config_collection, 'groups'):
            context['groups'] = self.config_collection.groups
        else:
            context['groups'] = None

        if 'extra_stylefiles' in self.config_collection.extra_context:
            if 'extra_stylefiles' in context:
                context['extra_stylefiles'].extend(self.config_collection.extra_context['extra_stylefiles'])
            else:
                context['extra_stylefiles'] = self.config_collection.extra_context['extra_stylefiles']

        if 'extra_javascript' in self.config_collection.extra_context:
            if 'extra_javascript' in context:
                context['extra_javascript'].extend(self.config_collection.extra_context['extra_javascript'])
            else:
                context['extra_javascript'] = self.config_collection.extra_context['extra_javascript']

        return context

    def get_success_url(self):
        """
        Returns the success url when changes are saved. Here it is the same
        url as the main menu entry.
        """
        return reverse('config_%s' % self.config_collection.url)

    def form_valid(self, form):
        """
        Saves all data of a valid form.
        """
        for key in form.cleaned_data:
            config[key] = form.cleaned_data[key]
        messages.success(self.request, _('%s settings successfully saved.') % _(self.config_collection.title))
        return super(ConfigView, self).form_valid(form)
