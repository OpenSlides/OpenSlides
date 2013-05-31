#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Tests for the widgets of openslides.account
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from django.test.client import Client

from openslides.utils.test import TestCase
from openslides.config.api import config
from openslides.participant.models import User


class PersonalInfoWidget(TestCase):
    """
    Tests the content of the personal info widget.
    """
    def import_agenda(self):
        """
        Helper function to make the module agenda optional.
        """
        try:
            from openslides import agenda
        except ImportError:
            return False
        else:
            return agenda

    def import_motion(self):
        """
        Helper function to make the module motion optional.
        """
        try:
            from openslides import motion
        except ImportError:
            return False
        else:
            return motion

    def import_assignment(self):
        """
        Helper function to make the module assignment optional.
        """
        try:
            from openslides import assignment
        except ImportError:
            return False
        else:
            return assignment

    def setUp(self):
        self.user = User.objects.create(username='HansMeiser')
        self.user.reset_password('default')
        self.client = Client()
        self.client.login(username='HansMeiser', password='default')

    def test_widget_appearance(self):
        response = self.client.get('/projector/dashboard/')
        self.assertContains(response, '<h3>My items, motions and elections</h3>', status_code=200)

    def test_item_list(self):
        agenda = self.import_agenda()
        if agenda:
            item_1 = agenda.models.Item.objects.create(title='My Item Title iw5ohNgee4eiYahb5Eiv')
            speaker = agenda.models.Speaker.objects.add(item=item_1, person=self.user)
            response = self.client.get('/projector/dashboard/')
            self.assertContains(response, 'I am on the list of speakers of the following items:', status_code=200)
            self.assertContains(response, 'My Item Title iw5ohNgee4eiYahb5Eiv', status_code=200)
            speaker.begin_speach()
            response = self.client.get('/projector/dashboard/')
            self.assertNotContains(response, 'My Item Title iw5ohNgee4eiYahb5Eiv', status_code=200)

    def test_submitter_list(self):
        motion = self.import_motion()
        if motion:
            motion_1 = motion.models.Motion.objects.create(title='My Motion Title pa8aeNohYai0ahge', text='My Motion Text')
            motion_2 = motion.models.Motion.objects.create(title='My Motion Title quielohL7vah1weochai', text='My Motion Text')
            submitter_1 = motion.models.MotionSubmitter.objects.create(motion=motion_1, person=self.user)
            submitter_2 = motion.models.MotionSubmitter.objects.create(motion=motion_2, person=self.user)
            response = self.client.get('/projector/dashboard/')
            self.assertContains(response, 'I submitted the following motions:', status_code=200)
            self.assertContains(response, 'My Motion Title pa8aeNohYai0ahge', status_code=200)
            self.assertContains(response, 'My Motion Title quielohL7vah1weochai', status_code=200)

    def test_supporter_list(self):
        motion = self.import_motion()
        if motion:
            motion_1 = motion.models.Motion.objects.create(title='My Motion Title jahN9phaiThae5ooKubu', text='My Motion Text')
            motion_2 = motion.models.Motion.objects.create(title='My Motion Title vech9ash8aeh9eej2Ga2', text='My Motion Text')
            supporter_1 = motion.models.MotionSupporter.objects.create(motion=motion_1, person=self.user)
            supporter_2 = motion.models.MotionSupporter.objects.create(motion=motion_2, person=self.user)
            config['motion_min_supporters'] = 1
            response = self.client.get('/projector/dashboard/')
            self.assertContains(response, 'I support the following motions:', status_code=200)
            self.assertContains(response, 'My Motion Title jahN9phaiThae5ooKubu', status_code=200)
            self.assertContains(response, 'My Motion Title vech9ash8aeh9eej2Ga2', status_code=200)

    def test_candidate_list(self):
        assignment = self.import_assignment()
        if assignment:
            assignment_1 = assignment.models.Assignment.objects.create(name='Hausmeister ooKoh7roApoo3phe', posts=1)
            assignment_1.run(candidate=self.user, person=self.user)
            response = self.client.get('/projector/dashboard/')
            self.assertContains(response, 'I am candidate for the following elections:', status_code=200)
            self.assertContains(response, 'Hausmeister ooKoh7roApoo3phe', status_code=200)
