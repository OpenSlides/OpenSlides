# Generated by Django 2.1 on 2018-08-31 13:17

from django.conf import settings
from django.contrib.auth.models import Permission
from django.db import migrations


def create_comment_sections_from_config_and_move_comments_to_own_model(
    apps, schema_editor
):
    ConfigStore = apps.get_model("core", "ConfigStore")
    Motion = apps.get_model("motions", "Motion")
    MotionComment = apps.get_model("motions", "MotionComment")
    MotionCommentSection = apps.get_model("motions", "MotionCommentSection")
    Group = apps.get_model(settings.AUTH_GROUP_MODEL)

    # try to get old motions_comments config variable, where all comment fields are saved
    try:
        motions_comments = ConfigStore.objects.get(key="motions_comments")
    except ConfigStore.DoesNotExist:
        return
    comments_sections = motions_comments.value

    # Delete config value
    motions_comments.delete()

    # Get can_see_comments and can_manage_comments permissions and the associated groups
    can_see_comments = Permission.objects.filter(codename="can_see_comments")
    if len(can_see_comments) == 1:
        # Save groups. list() is necessary to evaluate the database query right now.
        can_see_groups = list(can_see_comments.get().group_set.all())
    else:
        can_see_groups = Group.objects.all()

    can_manage_comments = Permission.objects.filter(codename="can_manage_comments")
    if len(can_manage_comments) == 1:
        # Save groups. list() is necessary to evaluate the database query right now.
        can_manage_groups = list(can_manage_comments.get().group_set.all())
    else:
        can_manage_groups = Group.objects.all()

    # Create comment sections. Map them to the old ids, so we can find the right section
    # when creating actual comments
    old_id_mapping = {}
    # Keep track of the special comment sections "forState" and "forRecommendation". If a
    # comment is found, the comment value will be assigned to new motion fields and not comments.
    forStateId = None
    forRecommendationId = None
    for id, section in comments_sections.items():
        if section is None:
            continue
        if section.get("forState", False):
            forStateId = id
        elif section.get("forRecommendation", False):
            forRecommendationId = id
        else:
            comment_section = MotionCommentSection(name=section["name"])
            comment_section.save(skip_autoupdate=True)
            comment_section.read_groups.add(*[group.id for group in can_see_groups])
            comment_section.write_groups.add(*[group.id for group in can_manage_groups])
            old_id_mapping[id] = comment_section

    # Create all comments objects
    comments = []
    for motion in Motion.objects.all():
        if not isinstance(motion.comments, dict):
            continue

        for section_id, comment_value in motion.comments.items():
            # Skip empty sections.
            comment_value = comment_value.strip()
            if comment_value == "":
                continue
            # Special comments will be moved to separate fields.
            if section_id == forStateId:
                motion.state_extension = comment_value
                motion.save(skip_autoupdate=True)
            elif section_id == forRecommendationId:
                motion.recommendation_extension = comment_value
                motion.save(skip_autoupdate=True)
            else:
                comment = MotionComment(
                    comment=comment_value,
                    motion=motion,
                    section=old_id_mapping[section_id],
                )
                comments.append(comment)
    MotionComment.objects.bulk_create(comments)


class Migration(migrations.Migration):

    dependencies = [("motions", "0012a_motion_comments_1")]

    operations = [
        # Move the comments and sections
        migrations.RunPython(
            create_comment_sections_from_config_and_move_comments_to_own_model
        )
    ]
