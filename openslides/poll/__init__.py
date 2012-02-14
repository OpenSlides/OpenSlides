from django.utils.translation import ugettext as _

from models import PollFormView, BasePoll


class DesicionPoll(PollFormView):
    vote_values = [_('yes'), _('no'), _('contained')]
    poll_class = BasePoll


class ChoicePoll(PollFormView):
    poll_class = BasePoll
