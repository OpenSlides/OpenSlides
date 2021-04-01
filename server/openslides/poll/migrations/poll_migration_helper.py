from ..models import BasePoll


def set_is_pseudoanonymized(poll_model_collection, poll_model_name):
    """
    Takes all polls of the given model and updates is_pseudoanonymized, if necessary.
    """

    def _set_is_pseudoanonymized(apps, schema_editor):
        PollModel = apps.get_model(poll_model_collection, poll_model_name)
        for poll in PollModel.objects.all():
            if poll.type == BasePoll.TYPE_PSEUDOANONYMOUS or all(
                not vote.user_id
                for option in poll.options.all()
                for vote in option.votes.all()
            ):
                poll.is_pseudoanonymized = True
                poll.save(skip_autoupdate=True)

    return _set_is_pseudoanonymized


def calculate_vote_fields(poll_model_collection, poll_model_name):
    """
    Takes all polls of the given model and updates votes*, if necessary.
    """

    def _calculate_vote_fields(apps, schema_editor):
        PollModel = apps.get_model(poll_model_collection, poll_model_name)
        for poll in PollModel.objects.all():
            if poll.state in (BasePoll.STATE_FINISHED, BasePoll.STATE_PUBLISHED):
                BasePoll.calculate_votes(poll)
                BasePoll.calculate_entitled_users(poll)
                poll.save(skip_autoupdate=True)

    return _calculate_vote_fields
