import json
import random

from locust import HttpUser, constant, task
from requests.exceptions import ConnectionError

from server.login_mixin import LoginMixin
from server.secrets import get_secrets
from server.task_set import TaskSet

host, username, password = get_secrets()
secure = host.startswith("https")

class UserBehavior(LoginMixin, TaskSet):
    def __init__(self, *args, **kwargs):
        TaskSet.__init__(self, secure, *args, **kwargs)
        LoginMixin.__init__(self, username, password)

    @task
    def set_presence(self):
        if not self.login():
            return

        presence = bool(random.getrandbits(1))
        self.request("/apps/users/setpresence/", presence)

class UserClass(HttpUser):
    tasks = [UserBehavior]
    wait_time = constant(1)
    host = host
