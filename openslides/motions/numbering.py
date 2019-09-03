from collections import defaultdict
from typing import Any, Dict, List, Tuple

from django.db import transaction
from django.db.models import Model

from ..core.config import config
from ..utils.rest_api import ValidationError
from .models import Category, Motion


__all__ = ["numbering"]


def numbering(main_category: Category) -> List[Model]:
    """
    Given the _main category_ by params the numbering of all motions in this or
    any subcategory is done. The numbering behaves as defined by the the following rules:
    - The set of the main category with all child categories are _affected categories_.
    - All motions in the affected categories are _affected motions_.
    - All affected motions are numbered with respect to 'category_weight' ordering.
    - Checks, if parents of all affected amendments, are also affected.
      So, all parents of every affected amendment must also be affected. If not,
      an error will be returned.
    - If a category does not have a prefix, the prefix of the first parent with
      one will be taken. This is just checked until the main category is reached.
      So, if the main category does not have a prefix, no prefix will be used.
    - If a motions should get a new identifier, that already a non-affected motion has,
      an error will be returned. It is ensured, that all identifiers generated with
      call will be unique.
    - Identifier of non-amendments: <A><B><C>
      <A>: Categories calculated prefix (see above; note: can be blank)
      <B>: '' if blanks are disabled or <A> is blank, else ' '
      <C>: Motion counter (unique existing counter for all affected motions)
    - Amendments: An amendment will get the following identifier: <A><B><C>
      <A>: Parent's _new_ identifier
      <B>: '', if blanks are disabled, else ' '
      <C>: Amendment prefix
      <D>: Amendment counter (counter for amendments of one parent)
    - Both counters may be filled with leading zeros according to `Motion.extend_identifier_number`
    - On errors, ValidationErrors with appropriate content will be raised.
    """
    # If the config is false, don't use blanks when building identifier.
    without_blank = not config["motions_identifier_with_blank"]

    # Get child categories (to build affected categories) and precalculate all prefixes.
    child_categories = get_child_categories(main_category)
    category_prefix_mapping = get_category_prefix_mapping(
        main_category, child_categories, without_blank
    )

    # put together to affected_categories
    affected_categories = [main_category]
    affected_categories.extend(child_categories)

    # Get all affected motions
    affected_motions = get_affected_motions(affected_categories)
    # The affected_motion_ids is used for a fast lookup later.
    affected_motion_ids = set([motion.id for motion in affected_motions])
    # Assert, that we do have some motions.
    if len(affected_motions) == 0:
        raise ValidationError({"detail": "No motions were numbered"})

    # To ensure, that amendments will get the _new_ identifier of the parent, the affected
    # motions are split in disjoint lists (keep the ordering right) by their " amendment level"
    # in the motion (amendment) tree. There are at most len(affected_motions) levels.
    # In this step it is also ensures, that every parent of an amendment is an affected motion.
    max_amendment_level, amendment_level_mapping = get_amendment_level_mapping(
        affected_motions, affected_motion_ids, main_category
    )

    # Generate new identifiers.
    new_identifier_mapping = generate_new_identifiers(
        max_amendment_level,
        amendment_level_mapping,
        category_prefix_mapping,
        without_blank,
    )

    # Check, if all new identifiers are not used in all non-afected motions.
    check_new_identifiers_for_conflicts(new_identifier_mapping, affected_motion_ids)

    # Change all identifiers
    return update_identifiers(affected_motions, new_identifier_mapping)


def get_child_categories(main_category: Category) -> List[Category]:
    # -> generate a mapping from a category id to all it's children with respect to `weight`:
    category_children_mapping: Dict[int, List[Category]] = defaultdict(list)
    for category in Category.objects.exclude(parent=None).order_by("weight").all():
        category_children_mapping[category.parent_id].append(category)

    # - collect child categories
    child_categories = []  # they are ordered like a flat tree would be.
    queue = category_children_mapping[main_category.id]
    queue.reverse()
    while len(queue) > 0:
        category = queue.pop()

        child_categories.append(category)
        children = category_children_mapping[category.id]
        if children:
            children.reverse()
            queue.extend(children)
    return child_categories


def get_category_prefix_mapping(
    main_category: Category, child_categories: List[Category], without_blank: bool
) -> Dict[int, str]:
    # Precalculates all prefixes, e.g. traversing the category tree up, if a category
    # does not have a prefix to search for a parent's one. Also the without_blank is
    # respected, so the prefixes may will have blanks.

    # Add main category as a lookup anchor.
    category_prefix_mapping: Dict[int, str] = {}
    if not main_category.prefix:
        main_category_prefix = ""
    elif without_blank:
        main_category_prefix = main_category.prefix
    else:
        main_category_prefix = f"{main_category.prefix} "
    category_prefix_mapping[main_category.id] = main_category_prefix

    for category in child_categories:
        # Update prefix map. It is ensured, that the parent does have a calculated prefix, because
        # the child_categories is an ordered flat tree.
        if category.prefix:
            if without_blank:
                prefix = category.prefix
            else:
                prefix = f"{category.prefix} "
            category_prefix_mapping[category.id] = prefix
        else:
            category_prefix_mapping[category.id] = category_prefix_mapping[
                category.parent_id
            ]
    return category_prefix_mapping


def get_affected_motions(affected_categories) -> List[Motion]:
    # Affected motions: A list of motions from all categories in the right category order
    # and sorted with `category_weight` per category.
    affected_motions = []
    for category in affected_categories:
        motions = (
            Motion.objects.prefetch_related(
                "agenda_items", "lists_of_speakers", "parent"
            )
            .filter(category=category)
            .order_by("category_weight", "id")
        )
        affected_motions.extend(list(motions))
    return affected_motions


def get_amendment_level_mapping(
    affected_motions, affected_motion_ids, main_category
) -> Tuple[int, Dict[int, List[Motion]]]:
    amendment_level_mapping: Dict[int, List[Motion]] = defaultdict(list)
    max_amendment_level = 0
    for motion in affected_motions:
        level = motion.amendment_level
        amendment_level_mapping[level].append(motion)
        if level > max_amendment_level:
            max_amendment_level = level
        if motion.parent_id is not None and motion.parent_id not in affected_motion_ids:
            raise ValidationError(
                {
                    "detail": 'Amendment "{0}" cannot be numbered, because '
                    "it's lead motion ({1}) is not in category "
                    "{2} or any subcategory.",
                    "args": [str(motion), str(motion.parent), str(main_category)],
                }
            )
    return max_amendment_level, amendment_level_mapping


def generate_new_identifiers(
    max_amendment_level, amendment_level_mapping, category_prefix_mapping, without_blank
) -> Dict[int, Any]:
    # Generate identifiers for all lead motions.
    new_identifier_mapping = {}
    for i, main_motion in enumerate(amendment_level_mapping[0]):
        prefix = category_prefix_mapping[
            main_motion.category_id
        ]  # without_blank is precalculated.
        number = i + 1
        identifier = f"{prefix}{Motion.extend_identifier_number(number)}"
        new_identifier_mapping[main_motion.id] = {
            "identifier": identifier,
            "number": number,
        }

    # - Generate new identifiers for all amendments. For this, they are travesed by level,
    # so the parent's identifier is already set.
    amendment_counter: Dict[int, int] = defaultdict(
        lambda: 1
    )  # maps amendment parent ids to their counter values.
    for level in range(1, max_amendment_level + 1):
        for amendment in amendment_level_mapping[level]:
            number = amendment_counter[amendment.parent_id]
            amendment_counter[amendment.parent_id] += 1
            parent_identifier = new_identifier_mapping[amendment.parent_id][
                "identifier"
            ]
            if without_blank:
                prefix = f"{parent_identifier}{config['motions_amendments_prefix']}"
            else:
                prefix = f"{parent_identifier} {config['motions_amendments_prefix']} "
            identifier = f"{prefix}{Motion.extend_identifier_number(number)}"
            new_identifier_mapping[amendment.id] = {
                "identifier": identifier,
                "number": number,
            }

    return new_identifier_mapping


def check_new_identifiers_for_conflicts(
    new_identifier_mapping, affected_motion_ids
) -> None:
    all_new_identifiers = [
        entry["identifier"] for entry in new_identifier_mapping.values()
    ]
    # Check, if any new identifier exists in any non-affected motion
    conflicting_motions = Motion.objects.exclude(id__in=affected_motion_ids).filter(
        identifier__in=all_new_identifiers
    )
    if conflicting_motions.exists():
        # We do have a conflict. Build a nice error message.
        conflicting_motion = conflicting_motions.first()
        if conflicting_motion.category:
            raise ValidationError(
                {
                    "detail": 'Numbering aborted because the motion identifier "{0}" already exists in category {1}.',
                    "args": [
                        conflicting_motion.identifier,
                        str(conflicting_motion.category),
                    ],
                }
            )
        else:
            raise ValidationError(
                {
                    "detail": 'Numbering aborted because the motion identifier "{0}" already exists.',
                    "args": [conflicting_motion.identifier],
                }
            )


def update_identifiers(affected_motions, new_identifier_mapping) -> List[Model]:
    # Acutally update the identifiers now.
    with transaction.atomic():
        changed_instances = []
        # Remove old identifiers, to avoid conflicts within the affected motions
        for motion in affected_motions:
            motion.identifier = None
            # This line is to skip agenda item and list of speakers autoupdate.
            # See agenda/signals.py.
            motion.set_skip_autoupdate_agenda_item_and_list_of_speakers()
            motion.save(skip_autoupdate=True)

        # Set the indetifier
        for motion in affected_motions:
            motion.identifier = new_identifier_mapping[motion.id]["identifier"]
            motion.identifier_number = new_identifier_mapping[motion.id]["number"]
            motion.set_skip_autoupdate_agenda_item_and_list_of_speakers()
            motion.save(skip_autoupdate=True)
            changed_instances.append(motion)
            if motion.agenda_item:
                changed_instances.append(motion.agenda_item)
            changed_instances.append(motion.list_of_speakers)

    return changed_instances
