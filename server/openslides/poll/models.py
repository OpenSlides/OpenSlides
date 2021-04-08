from decimal import Decimal
from typing import Iterable, Optional, Tuple, Type

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.crypto import get_random_string
from jsonfield import JSONField

from openslides.utils.manager import BaseManager

from ..core.config import config
from ..utils.autoupdate import inform_changed_data, inform_deleted_data
from ..utils.models import SET_NULL_AND_AUTOUPDATE


def generate_user_token():
    """ Generates a 16 character alphanumeric token. """
    return get_random_string(16)


class BaseVote(models.Model):
    """
    All subclasses must have option attribute with the related name "votes"
    """

    weight = models.DecimalField(
        default=Decimal("1"),
        validators=[MinValueValidator(Decimal("-2"))],
        max_digits=15,
        decimal_places=6,
    )
    value = models.CharField(max_length=1, choices=(("Y", "Y"), ("N", "N"), ("A", "A")))
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        default=None,
        null=True,
        blank=True,
        on_delete=SET_NULL_AND_AUTOUPDATE,
    )
    delegated_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        default=None,
        null=True,
        blank=True,
        on_delete=SET_NULL_AND_AUTOUPDATE,
        related_name="%(class)s_delegated_votes",
    )
    user_token = models.CharField(default=generate_user_token, max_length=16)

    class Meta:
        abstract = True


class BaseVoteManager(BaseManager):
    """
    Base vote manager that supplies the generate_user_token method.
    """

    def generate_user_token(self):
        return generate_user_token()


class BaseOption(models.Model):
    """
    All subclasses must have poll attribute with the related name "options"
    """

    vote_class: Optional[Type["BaseVote"]] = None

    class Meta:
        abstract = True

    @property
    def yes(self) -> Decimal:
        return self.sum_weight("Y")

    @property
    def no(self) -> Decimal:
        return self.sum_weight("N")

    @property
    def abstain(self) -> Decimal:
        return self.sum_weight("A")

    def sum_weight(self, value):
        # We could do this in a nice .aggregate(Sum...) querystatement,
        # but these might be expensive DB queries, because they are not preloaded.
        # With this in-logic-counting, we operate inmemory.
        weight_sum = Decimal(0)
        for vote in self.votes.all():
            if vote.value == value:
                weight_sum += vote.weight
        return weight_sum

    @classmethod
    def get_vote_class(cls):
        if cls.vote_class is None:
            raise NotImplementedError(
                f"The option class {cls} has to have an attribute vote_class."
            )
        return cls.vote_class

    def get_votes(self):
        """
        Return a QuerySet with all vote objects related to this option.
        """
        return self.get_vote_class().objects.filter(option=self)

    def pseudoanonymize(self):
        for vote in self.get_votes():
            vote.user = None
            vote.save()

    def reset(self):
        # Delete votes
        votes = self.get_votes()
        votes_id = [vote.id for vote in votes]
        votes.delete()
        collection = self.get_vote_class().get_collection_string()
        inform_deleted_data((collection, id) for id in votes_id)

        # update self because the changed voted relation
        inform_changed_data(self)


class BasePoll(models.Model):
    option_class: Optional[Type["BaseOption"]] = None

    STATE_CREATED = 1
    STATE_STARTED = 2
    STATE_FINISHED = 3
    STATE_PUBLISHED = 4
    STATES = (
        (STATE_CREATED, "Created"),
        (STATE_STARTED, "Started"),
        (STATE_FINISHED, "Finished"),
        (STATE_PUBLISHED, "Published"),
    )
    state = models.IntegerField(choices=STATES, default=STATE_CREATED)

    TYPE_ANALOG = "analog"
    TYPE_NAMED = "named"
    TYPE_PSEUDOANONYMOUS = "pseudoanonymous"
    TYPES = (
        (TYPE_ANALOG, "analog"),
        (TYPE_NAMED, "nominal"),
        (TYPE_PSEUDOANONYMOUS, "non-nominal"),
    )
    type = models.CharField(max_length=64, blank=False, null=False, choices=TYPES)

    title = models.CharField(max_length=255, blank=True, null=False)
    groups = models.ManyToManyField(settings.AUTH_GROUP_MODEL, blank=True)
    voted = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True)

    votesvalid = models.DecimalField(
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("-2"))],
        max_digits=15,
        decimal_places=6,
    )
    votesinvalid = models.DecimalField(
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("-2"))],
        max_digits=15,
        decimal_places=6,
    )
    votescast = models.DecimalField(
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("-2"))],
        max_digits=15,
        decimal_places=6,
    )

    PERCENT_BASE_YN = "YN"
    PERCENT_BASE_YNA = "YNA"
    PERCENT_BASE_VALID = "valid"
    PERCENT_BASE_CAST = "cast"
    PERCENT_BASE_ENTITLED = "entitled"
    PERCENT_BASE_DISABLED = "disabled"
    PERCENT_BASES: Iterable[Tuple[str, str]] = (
        (PERCENT_BASE_YN, "Yes/No"),
        (PERCENT_BASE_YNA, "Yes/No/Abstain"),
        (PERCENT_BASE_VALID, "All valid ballots"),
        (PERCENT_BASE_CAST, "All casted ballots"),
        (PERCENT_BASE_ENTITLED, "All entitled users"),
        (PERCENT_BASE_DISABLED, "Disabled (no percents)"),
    )  # type: ignore
    onehundred_percent_base = models.CharField(
        max_length=8, blank=False, null=False, choices=PERCENT_BASES
    )

    MAJORITY_SIMPLE = "simple"
    MAJORITY_TWO_THIRDS = "two_thirds"
    MAJORITY_THREE_QUARTERS = "three_quarters"
    MAJORITY_DISABLED = "disabled"
    MAJORITY_METHODS = (
        (MAJORITY_SIMPLE, "Simple majority"),
        (MAJORITY_TWO_THIRDS, "Two-thirds majority"),
        (MAJORITY_THREE_QUARTERS, "Three-quarters majority"),
        (MAJORITY_DISABLED, "Disabled"),
    )
    majority_method = models.CharField(
        max_length=14, blank=False, null=False, choices=MAJORITY_METHODS
    )

    is_pseudoanonymized = models.BooleanField(default=False)

    entitled_users_at_stop = JSONField(null=True)

    class Meta:
        abstract = True

    def create_options(self):
        """ Should be called after creation of this model. """
        raise NotImplementedError()

    @classmethod
    def get_option_class(cls):
        if cls.option_class is None:
            raise NotImplementedError(
                f"The poll class {cls} has to have an attribute option_class."
            )
        return cls.option_class

    def get_options(self):
        """
        Returns the option objects for the poll.
        """
        return self.options.all()

    @classmethod
    def get_vote_class(cls):
        return cls.get_option_class().get_vote_class()

    def get_votes(self):
        """
        Return a QuerySet with all vote objects related to this poll.
        """
        return self.get_vote_class().objects.filter(option__poll__id=self.id)

    def pseudoanonymize(self):
        for option in self.get_options():
            option.pseudoanonymize()
        self.is_pseudoanonymized = True
        self.save()

    def reset(self):
        for option in self.get_options():
            option.reset()

        self.voted.clear()

        # Reset state
        self.state = BasePoll.STATE_CREATED
        if self.type == self.TYPE_ANALOG:
            self.votesvalid = None
            self.votesinvalid = None
            self.votescast = None
        if self.type != self.TYPE_PSEUDOANONYMOUS:
            self.is_pseudoanonymized = False
        self.save()

    def calculate_votes(self):
        if self.type != BasePoll.TYPE_ANALOG:
            self.votescast = self.voted.count()
            if config["users_activate_vote_weight"]:
                self.votesvalid = sum(self.voted.values_list("vote_weight", flat=True))
            else:
                self.votesvalid = self.votescast
            self.votesinvalid = Decimal(0)

    def calculate_entitled_users(self):
        entitled_users = []
        entitled_users_ids = set()
        for group in self.groups.all():
            for user in group.user_set.all():
                if user.is_present and user.id not in entitled_users_ids:
                    entitled_users_ids.add(user.id)
                    entitled_users.append(
                        {
                            "user_id": user.id,
                            "voted": user in self.voted.all(),
                            "vote_delegated_to_id": user.vote_delegated_to_id,
                        }
                    )
        self.entitled_users_at_stop = entitled_users

    def stop(self):
        """
        Saves a snapshot of the current voted users into the relevant fields and stops the poll.
        """
        self.calculate_votes()
        self.calculate_entitled_users()
        self.state = self.STATE_FINISHED
        self.save()
