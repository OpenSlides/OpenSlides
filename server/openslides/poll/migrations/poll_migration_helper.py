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


def remove_entitled_users_duplicates(poll_model_collection, poll_model_name):
    """
    Takes all polls of the given model and removes any duplicate entries from
    entitled_users_at_stop
    """

    def _remove_entitled_users_duplicates(apps, schema_editor):
        PollModel = apps.get_model(poll_model_collection, poll_model_name)
        for poll in PollModel.objects.all():
            if poll.entitled_users_at_stop:
                new_entitled_users = []
                entitled_users_ids = set()
                for entry in poll.entitled_users_at_stop:
                    if entry["user_id"] not in entitled_users_ids:
                        entitled_users_ids.add(entry["user_id"])
                        new_entitled_users.append(entry)
                poll.entitled_users_at_stop = new_entitled_users
                poll.save(skip_autoupdate=True)

    return _remove_entitled_users_duplicates
