import re
from typing import Generator, Type

from ..core.config import config
from ..core.exceptions import ProjectorException
from ..utils.projector import ProjectorElement
from .models import Motion, MotionBlock, MotionChangeRecommendation, Workflow


class MotionSlide(ProjectorElement):
    """
    Slide definitions for Motion model.
    """
    name = 'motions/motion'

    def check_data(self):
        if not Motion.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('Motion does not exist.')

    def get_requirements(self, config_entry):
        try:
            motion = Motion.objects.get(pk=config_entry.get('id'))
        except Motion.DoesNotExist:
            # Motion does not exist. Just do nothing.
            pass
        else:
            yield motion
            yield motion.agenda_item
            yield motion.state.workflow
            yield from self.required_motions_for_state_and_recommendation(motion)
            yield from motion.get_paragraph_based_amendments()
            for submitter in motion.submitters.all():
                yield submitter.user
            yield from motion.supporters.all()
            yield from MotionChangeRecommendation.objects.filter(motion_version=motion.get_active_version().id)
            if motion.parent:
                yield motion.parent

    def required_motions_for_state_and_recommendation(self, motion):
        """
        Returns a list of motions needed for the projector, because they are mentioned
        in additional fieds for the state and recommendation.
        Keep the motion_syntax syncronized with the MotionStateAndRecommendationParser on the client.
        """
        # get the comments field for state and recommendation
        motion_syntax = re.compile(r'\[motion:(\d+)\]')
        fields = config['motions_comments']
        state_field_id = None
        recommendation_field_id = None

        for id, field in fields.items():
            if isinstance(field, dict):
                if field.get('forState', False):
                    state_field_id = id
                if field.get('forRecommendation', False):
                    recommendation_field_id = id

        # extract all mentioned motions from the state and recommendation
        motion_ids = set()
        if state_field_id is not None:
            state_text = motion.comments.get(state_field_id)
            motion_ids.update([int(id) for id in motion_syntax.findall(state_text)])

        if recommendation_field_id is not None:
            recommendation_text = motion.comments.get(recommendation_field_id)
            motion_ids.update([int(id) for id in motion_syntax.findall(recommendation_text)])

        # return all motions
        return Motion.objects.filter(pk__in=motion_ids)

    def get_collection_elements_required_for_this(self, collection_element, config_entry):
        output = super().get_collection_elements_required_for_this(collection_element, config_entry)
        # Full update if motion changes because then we may have new
        # submitters or supporters and therefor need new users.
        #
        # Add some logic here if we support live changing of workflows later.
        #
        if collection_element.collection_string == Motion.get_collection_string() and collection_element.id == config_entry.get('id'):
            output.extend(self.get_requirements_as_collection_elements(config_entry))
        return output

    def update_data(self):
        data = None
        try:
            motion = Motion.objects.get(pk=self.config_entry.get('id'))
        except Motion.DoesNotExist:
            # Motion does not exist, so just do nothing.
            pass
        else:
            data = {'agenda_item_id': motion.agenda_item_id}
        return data


class MotionBlockSlide(ProjectorElement):
    """
    Slide definitions for a block of motions (MotionBlock model).
    """
    name = 'motions/motion-block'

    def check_data(self):
        if not MotionBlock.objects.filter(pk=self.config_entry.get('id')).exists():
            raise ProjectorException('MotionBlock does not exist.')

    def get_requirements(self, config_entry):
        try:
            motion_block = MotionBlock.objects.get(pk=config_entry.get('id'))
        except MotionBlock.DoesNotExist:
            # MotionBlock does not exist. Just do nothing.
            pass
        else:
            yield motion_block
            yield motion_block.agenda_item
            yield from motion_block.motion_set.all()
            yield from Workflow.objects.all()

    def get_collection_elements_required_for_this(self, collection_element, config_entry):
        output = super().get_collection_elements_required_for_this(collection_element, config_entry)
        # Send all changed motions to the projector, because it may be appended
        # or removed from the block.
        if collection_element.collection_string == Motion.get_collection_string():
            output.append(collection_element)
        return output

    def update_data(self):
        data = None
        try:
            motion_block = MotionBlock.objects.get(pk=self.config_entry.get('id'))
        except MotionBlock.DoesNotExist:
            # MotionBlock does not exist, so just do nothing.
            pass
        else:
            data = {'agenda_item_id': motion_block.agenda_item_id}
        return data


def get_projector_elements() -> Generator[Type[ProjectorElement], None, None]:
    yield MotionSlide
    yield MotionBlockSlide
