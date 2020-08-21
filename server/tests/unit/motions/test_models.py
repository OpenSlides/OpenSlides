from unittest import TestCase

from openslides.motions.models import Motion, MotionChangeRecommendation


# TODO: test for MotionPoll.set_options()


class MotionChangeRecommendationTest(TestCase):
    def test_overlapping_line_numbers(self):
        """
        Tests that a change recommendation directly before another one can be created
        """
        motion = Motion()
        existing_recommendation = MotionChangeRecommendation()
        existing_recommendation.line_from = 5
        existing_recommendation.line_to = 7
        existing_recommendation.rejected = False
        existing_recommendation.motion = motion
        other_recommendations = [existing_recommendation]

        new_recommendation1 = MotionChangeRecommendation()
        new_recommendation1.line_from = 3
        new_recommendation1.line_to = 5
        collides = new_recommendation1.collides_with_other_recommendation(
            other_recommendations
        )
        self.assertFalse(collides)

        new_recommendation2 = MotionChangeRecommendation()
        new_recommendation2.line_from = 3
        new_recommendation2.line_to = 6
        collides = new_recommendation2.collides_with_other_recommendation(
            other_recommendations
        )
        self.assertTrue(collides)

        new_recommendation3 = MotionChangeRecommendation()
        new_recommendation3.line_from = 6
        new_recommendation3.line_to = 8
        collides = new_recommendation3.collides_with_other_recommendation(
            other_recommendations
        )
        self.assertTrue(collides)

        new_recommendation4 = MotionChangeRecommendation()
        new_recommendation4.line_from = 7
        new_recommendation4.line_to = 9
        collides = new_recommendation4.collides_with_other_recommendation(
            other_recommendations
        )
        self.assertFalse(collides)
