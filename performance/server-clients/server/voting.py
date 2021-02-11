# TODO: This is untested and experimental

import json
import sys

from locust import HttpUser, constant, task

from .login_mixin import LoginMixin
from .secrets import get_secrets
from .task_set import TaskSet

USERS = list(range(1, 5000))[::-1]

MOTION_POLL_ID = 1

# get amount of users
index = sys.argv.index("-u")
AMOUNT = int(sys.argv[index + 1])


class UserBehavior(LoginMixin, TaskSet):
    state = {"amount_logged_in": 0}

    def __init__(self, *args, **kwargs):
        self.id = USERS.pop()
        self.logged_in = False
        self.is_present = False
        self.has_voted = False
        self.cookies = None
        self.username = f"user{self.id}"
        self.password = self.username
        super().__init__(*args, **kwargs)

    def on_stop(self):
        USERS.append(self.id)
        if self.logged_in:
            self.state["amount_logged_in"] -= 1

    def on_login(self):
        self.state["amount_logged_in"] += 1

    @task
    def vote(self):
        if not self.login():
            return
        if self.state["amount_logged_in"] != AMOUNT:
            return
        # if not self.set_present():
        #    return
        if self.has_voted:
            return

        url = f"/rest/motions/motion-poll/{MOTION_POLL_ID}/vote/"
        data = {"data": "Y"}
        if self.request(url, data):
            self.has_voted = True

    def set_present(self):
        if self.is_present:
            return True

        if self.request("/apps/users/setpresence/", True):
            self.is_present = True

        return self.is_present


class UserClass(HttpUser):
    tasks = [UserBehavior]
    wait_time = constant(1)
