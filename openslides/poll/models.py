from decimal import Decimal
from typing import Optional, Type

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from ..utils.autoupdate import inform_deleted_data
from ..utils.models import SET_NULL_AND_AUTOUPDATE


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

    class Meta:
        abstract = True

    def get_root_rest_element(self):
        return self.option.get_root_rest_element()


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

    def get_root_rest_element(self):
        return self.poll.get_root_rest_element()


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
        (TYPE_ANALOG, "Analog"),
        (TYPE_NAMED, "Named"),
        (TYPE_PSEUDOANONYMOUS, "Pseudoanonymous"),
    )
    type = models.CharField(max_length=64, blank=False, null=False, choices=TYPES)

    title = models.CharField(max_length=255, blank=True, null=False)
    groups = models.ManyToManyField(settings.AUTH_GROUP_MODEL, blank=True)
    voted = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True)

    db_votesvalid = models.DecimalField(
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("-2"))],
        max_digits=15,
        decimal_places=6,
    )
    db_votesinvalid = models.DecimalField(
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("-2"))],
        max_digits=15,
        decimal_places=6,
    )
    db_votescast = models.DecimalField(
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("-2"))],
        max_digits=15,
        decimal_places=6,
    )

    class Meta:
        abstract = True

    def get_votesvalid(self):
        if self.type == self.TYPE_ANALOG:
            return self.db_votesvalid
        else:
            return Decimal(self.count_users_voted())

    def set_votesvalid(self, value):
        if self.type != self.TYPE_ANALOG:
            raise ValueError("Do not set votesvalid for non analog polls")
        self.db_votesvalid = value

    votesvalid = property(get_votesvalid, set_votesvalid)

    def get_votesinvalid(self):
        if self.type == self.TYPE_ANALOG:
            return self.db_votesinvalid
        else:
            return Decimal(0)

    def set_votesinvalid(self, value):
        if self.type != self.TYPE_ANALOG:
            raise ValueError("Do not set votesinvalid for non analog polls")
        self.db_votesinvalid = value

    votesinvalid = property(get_votesinvalid, set_votesinvalid)

    def get_votescast(self):
        if self.type == self.TYPE_ANALOG:
            return self.db_votescast
        else:
            return Decimal(self.count_users_voted())

    def set_votescast(self, value):
        if self.type != self.TYPE_ANALOG:
            raise ValueError("Do not set votescast for non analog polls")
        self.db_votescast = value

    votescast = property(get_votescast, set_votescast)

    def count_users_voted(self):
        return self.voted.all().count()

    def get_options(self):
        """
        Returns the option objects for the poll.
        """
        return self.get_option_class().objects.filter(poll=self)

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

    @classmethod
    def get_vote_class(cls):
        return cls.get_option_class().get_vote_class()

    def get_votes(self):
        """
        Return a QuerySet with all vote objects related to this poll.

        TODO: This might be a performance issue when used in properties that are serialized.
        """
        return self.get_vote_class().objects.filter(option__poll__id=self.id)

    def pseudoanonymize(self):
        for vote in self.get_votes():
            vote.user = None
            vote.save()

    def reset(self):
        self.voted.clear()

        # Delete votes
        votes = self.get_votes()
        votes_id = [vote.id for vote in votes]
        votes.delete()
        collection = self.get_vote_class().get_collection_string()
        inform_deleted_data((collection, id) for id in votes_id)

        # Reset state
        self.state = BasePoll.STATE_CREATED
        if self.type == self.TYPE_ANALOG:
            self.votesvalid = None
            self.votesinvalid = None
            self.votescast = None
        self.save()
