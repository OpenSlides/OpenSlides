from django.test.client import Client

from openslides.assignment.models import Assignment, AssignmentPoll
from openslides.config.api import config
from openslides.participant.models import Group, User
from openslides.utils.test import TestCase


class AssignmentViewTestCase(TestCase):
    def setUp(self):
        # Admin
        self.admin = User.objects.get(pk=1)
        self.admin_client = Client()
        self.admin_client.login(username='admin', password='admin')

        # Staff
        self.staff = User.objects.create_user('staff', 'staff@user.user', 'staff')
        staff_group = Group.objects.get(name='Staff')
        self.staff.groups.add(staff_group)
        self.staff.save()
        self.staff_client = Client()
        self.staff_client.login(username='staff', password='staff')

        # Delegate
        self.delegate = User.objects.create_user('delegate', 'delegate@user.user', 'delegate')
        delegate_group = Group.objects.get(name='Delegates')
        self.delegate.groups.add(delegate_group)
        self.delegate.save()
        self.delegate_client = Client()
        self.delegate_client.login(username='delegate', password='delegate')

        # Registered
        self.registered = User.objects.create_user('registered', 'registered@user.user', 'registered')
        self.registered_client = Client()
        self.registered_client.login(username='registered', password='registered')

        self.assignment1 = Assignment.objects.create(name='test', posts=2)

    def check_url(self, url, test_client, response_cose):
        response = test_client.get(url)
        self.assertEqual(response.status_code, response_cose)
        return response


class TestAssignmentPollDelete(AssignmentViewTestCase):
    def setUp(self):
        super(TestAssignmentPollDelete, self).setUp()
        self.assignment1.gen_poll()

    def test_get(self):
        response = self.check_url('/assignment/poll/1/del/', self.admin_client, 302)
        self.assertRedirects(response, 'assignment/1/')

    def test_post(self):
        response = self.admin_client.post('/assignment/poll/1/del/', {'yes': 1})
        self.assertRedirects(response, '/assignment/1/')


class TestAssignmentDetailView(AssignmentViewTestCase):
    def test_blocked_candidates_view(self):
        """
        Tests that a delegate runs for a vote and then withdraws himself.
        """
        response = self.staff_client.get('/assignment/1/')
        self.assertContains(response, 'No candidates available.')
        self.assertNotContains(response, 'Blocked Candidates')

        response = self.delegate_client.get('/assignment/1/run/')
        self.assertTrue(self.assignment1.is_candidate(self.delegate))
        self.assertFalse(self.assignment1.is_blocked(self.delegate))

        response = self.staff_client.get('/assignment/1/')
        self.assertNotContains(response, 'No candidates available.')
        self.assertNotContains(response, 'Blocked Candidates')

        response = self.delegate_client.get('/assignment/1/delrun/')
        self.assertFalse(self.assignment1.is_candidate(self.delegate))
        self.assertTrue(self.assignment1.is_blocked(self.delegate))

        response = self.staff_client.get('/assignment/1/')
        self.assertContains(response, 'No candidates available.')
        self.assertContains(response, 'Blocked Candidates')


class TestAssignmentPollCreateView(TestCase):
    """
    Tests the creation of assignment polls.
    """
    def test_assignment_add_candidate(self):
        admin = User.objects.get(pk=1)
        self.assignment = Assignment.objects.create(
            name='test_assignment_oiL2heerookiegeirai0',
            posts=1)
        self.assignment.run(admin, admin)
        self.assertEqual(len(Assignment.objects.get(pk=self.assignment.pk).candidates), 1)

    def test_assignment_poll_creation(self):
        self.test_assignment_add_candidate()
        self.assignment.set_status('vot')
        admin_client = Client()
        admin_client.login(username='admin', password='admin')
        self.assertFalse(AssignmentPoll.objects.exists())
        self.assertEqual(config['assignment_poll_vote_values'], 'auto')
        response = admin_client.get('/assignment/1/gen_poll/')
        self.assertRedirects(response, '/assignment/1/')
        poll = AssignmentPoll.objects.get()
        self.assertEqual(poll.assignment, self.assignment)
        self.assertEqual(poll.assignmentoption_set.count(), 1)
        self.assertTrue(poll.yesnoabstain)


class TestAssignmentPollPdfView(TestCase):
    """
    Tests the creation of the assignment poll pdf
    """

    def test_assignment_create_poll_pdf(self):
        # Create a assignment with a poll
        admin = User.objects.get(pk=1)
        assignment = Assignment.objects.create(name='assignment1', posts=1)
        assignment.run(admin, admin)
        assignment.set_status('vot')
        assignment.gen_poll()
        client = Client()
        client.login(username='admin', password='admin')

        # request the pdf
        response = client.get('/assignment/poll/1/print/')

        # test the response
        self.assertEqual(response.status_code, 200)
