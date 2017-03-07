import locale

from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.utils.translation import ugettext as _

from openslides.utils.models import MinMaxIntegerField


class BaseOption(models.Model):
    """
    Base option class for a poll.

    Subclasses have to define a poll field. This must be a ForeignKeyField
    to a subclass of BasePoll. There must also be a vote_class attribute
    which has to be a subclass of BaseVote. Otherwise you have to override the
    get_vote_class method.
    """
    vote_class = None

    class Meta:
        abstract = True

    def get_votes(self):
        return self.get_vote_class().objects.filter(option=self)

    def get_vote_class(self):
        if self.vote_class is None:
            raise NotImplementedError('The option class %s has to have an attribute vote_class.' % self)
        return self.vote_class

    def __getitem__(self, name):
        try:
            return self.get_votes().get(value=name)
        except self.get_vote_class().DoesNotExist:
            raise KeyError


class BaseVote(models.Model):
    """
    Base vote class for an option.

    Subclasses have to define an option field. This must be a ForeignKeyField
    to a subclass of BasePoll.
    """
    weight = models.IntegerField(default=1, null=True)  # Use MinMaxIntegerField
    value = models.CharField(max_length=255, null=True)

    class Meta:
        abstract = True

    def __str__(self):
        return self.print_weight()

    def get_value(self):
        return _(self.value)

    def print_weight(self, raw=False):
        if raw:
            return self.weight
        try:
            percent_base = self.option.poll.get_percent_base()
        except AttributeError:
            # The poll class is no child of CollectVotesCast
            percent_base = 0
        return print_value(self.weight, percent_base)


class CollectDefaultVotesMixin(models.Model):
    """
    Mixin for a poll to collect the default vote values for valid votes,
    invalid votes and votes cast.
    """
    votesvalid = MinMaxIntegerField(null=True, blank=True, min_value=-2)
    votesinvalid = MinMaxIntegerField(null=True, blank=True, min_value=-2)
    votescast = MinMaxIntegerField(null=True, blank=True, min_value=-2)

    class Meta:
        abstract = True

    def append_pollform_fields(self, fields):
        fields.append('votesvalid')
        fields.append('votesinvalid')
        fields.append('votescast')
        super(CollectDefaultVotesMixin, self).append_pollform_fields(fields)

    def get_percent_base_choice(self):
        """
        Returns one of the strings of the percent base.
        """
        raise NotImplementedError('You have to provide a get_percent_base_choice() method.')


class PublishPollMixin(models.Model):
    """
    Mixin for a poll to add a flag whether the poll is published or not.
    """
    published = models.BooleanField(default=False)

    class Meta:
        abstract = True

    def set_published(self, published):
        self.published = published
        self.save()


class BasePoll(models.Model):
    """
    Base poll class.
    """
    vote_values = ['Votes']

    class Meta:
        abstract = True

    def has_votes(self):
        """
        Returns True if there are votes in the poll.
        """
        if self.get_votes().exists():
            return True
        return False

    def set_options(self, options_data=[]):
        """
        Adds new option objects to the poll.

        option_data: A list of arguments for the option.
        """
        for option_data in options_data:
            option = self.get_option_class()(**option_data)
            option.poll = self
            option.save()

    def get_options(self):
        """
        Returns the option objects for the poll.
        """
        return self.get_option_class().objects.filter(poll=self)

    def get_option_class(self):
        """
        Returns the option class for the poll. Default is self.option_class.
        """
        return self.option_class

    def get_vote_values(self):
        """
        Returns the possible values for the poll. Default is as list.
        """
        return self.vote_values

    def get_vote_class(self):
        """
        Returns the related vote class.
        """
        return self.get_option_class().vote_class

    def get_votes(self):
        """
        Return a QuerySet with all vote objects related to this poll.
        """
        return self.get_vote_class().objects.filter(option__poll__id=self.id)

    def set_vote_objects_with_values(self, option, data, skip_autoupdate=False):
        """
        Creates or updates the vote objects for the poll.
        """
        for value in self.get_vote_values():
            try:
                vote = self.get_votes().filter(option=option).get(value=value)
            except ObjectDoesNotExist:
                vote = self.get_vote_class()(option=option, value=value)
            vote.weight = data[value]
            vote.save(skip_autoupdate=skip_autoupdate)

    def get_vote_objects_with_values(self, option_id):
        """
        Returns the vote values and their weight as a list with two elements.
        """
        values = []
        for value in self.get_vote_values():
            try:
                vote = self.get_votes().filter(option=option_id).get(value=value)
            except ObjectDoesNotExist:
                values.append(self.get_vote_class()(value=value, weight=''))
            else:
                values.append(vote)
        return values

    def get_vote_form(self, **kwargs):
        """
        Returns the form for one option of the poll.
        """
        from openslides.poll.forms import OptionForm
        return OptionForm(extra=self.get_vote_objects_with_values(kwargs['formid']),
                          **kwargs)

    def get_vote_forms(self, **kwargs):
        """
        Returns a list of forms for the poll.
        """
        forms = []
        for option in self.get_options():
            form = self.get_vote_form(formid=option.id, **kwargs)
            form.option = option
            forms.append(form)
        return forms

    def append_pollform_fields(self, fields):
        """
        Appends additional field to a given list of fields. By default it
        appends nothing.
        """
        pass


def print_value(value, percent_base=0):
    """
    Returns a human readable string for the vote value. It is 'majority',
    'undocumented' or the vote value with percent value if so.
    """
    if value == -1:
        verbose_value = _('majority')
    elif value == -2:
        verbose_value = _('undocumented')
    elif value is None:
        verbose_value = _('undocumented')
    else:
        if percent_base:
            locale.setlocale(locale.LC_ALL, '')
            verbose_value = u'%d (%s %%)' % (value, locale.format('%.1f', value * percent_base))
        else:
            verbose_value = u'%s' % value
    return verbose_value
