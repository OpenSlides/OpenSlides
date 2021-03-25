from ..models import generate_user_token


def set_user_tokens(vote_model_collection, vote_model_name):
    """
    Takes all votes of the given model and checks their tokens. For named polls,
    multiple votes with the same user_id will get the same token.
    """

    def _set_user_token(apps, schema_editor):
        user_token_map = {}
        VoteModel = apps.get_model(vote_model_collection, vote_model_name)
        for vote in VoteModel.objects.all():
            if vote.user is not None:
                key = (vote.user_id, vote.option.poll_id)
                if key not in user_token_map:
                    user_token_map[key] = generate_user_token()
                token = user_token_map[key]
            else:
                token = generate_user_token()
            vote.user_token = token
            vote.save(skip_autoupdate=True)

    return _set_user_token
