from system.api import config_set, config_get
from projector.models import SLIDE


def get_slide_from_sid(sid):
    try:
        model, id = sid.split()
    except ValueError:
        return None # We need a slideError hier
    except AttributeError:
        return None
    return SLIDE[model].objects.get(pk=id)


def get_active_slide(only_sid=False):
    """
    Returns the active slide. If no slide is active, or it can not find an Item,
    it raise an error

    if only_sid is True, returns only the id of this item. Returns None if not Item
    is active. Does not Raise Item.DoesNotExist
    """
    sid = config_get("presentation", None)

    if only_sid:
        return sid
    return get_slide_from_sid(sid)


def register_slidemodel(model):
    SLIDE[model.prefix] = model


def assignment_votes(item):
    votes = []
    if item.type == "ItemAssignment":
        assignment = item.cast().assignment
        publish_winner_results_only = config_get("assignment_publish_winner_results_only")
        # list of votes
        votes = []
        for candidate in assignment.candidates:
            tmplist = [[candidate, assignment.is_elected(candidate)], []]
            for poll in assignment.poll_set.all():
                if poll.published:
                    if candidate in poll.options_values:
                        # check config option 'publish_winner_results_only'
                        if not publish_winner_results_only \
                        or publish_winner_results_only and assignment.is_elected(candidate):
                            option = Option.objects.filter(poll=poll).filter(user=candidate)[0]
                            if poll.optiondecision:
                                tmplist[1].append([option.yes, option.no, option.undesided])
                            else:
                                tmplist[1].append(option.yes)
                        else:
                            tmplist[1].append("")
                    else:
                        tmplist[1].append("-")
            votes.append(tmplist)
    return votes


def assignment_polls(item):
    polls = []
    if item.type == "ItemAssignment":
        for poll in item.cast().assignment.poll_set.filter(assignment=item.cast().assignment):
            polls.append(poll)
    return polls
