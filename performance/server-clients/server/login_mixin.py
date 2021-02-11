import json
import sys

from requests.exceptions import ConnectionError


class LoginMixin:
    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.logged_in = False
        self.cookies = None

    def login(self):
        if self.logged_in:
            return True

        data = {"username": self.username, "password": self.password}
        with self.post("/apps/users/login/", data, catch_response=True) as res:
            try:
                if res.ok:
                    whoami = res.json()
                    if whoami["user"] is None:
                        res.failure("Was not logged in")
                    else:
                        self.cookies = res.cookies
                        self.logged_in = True
                        self.on_login()
                        res.success()
                else:
                    res.failure(f"not ok: {res.status_code}")
            except ConnectionError:
                res.failure("ConnectionError")

        return self.logged_in

    def on_login(self):
        pass
