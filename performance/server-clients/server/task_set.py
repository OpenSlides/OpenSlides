import json

from locust import TaskSet as _TaskSet
from requests.exceptions import ConnectionError


class TaskSet(_TaskSet):
    def __init__(self, secure, *args, **kwargs):
        self.secure = secure
        super().__init__(*args, **kwargs)

    def request(self, url, data=None):
        with self.json_post(url, data) as res:
            try:
                if res.ok:
                    res.success()
                    return True
                else:
                    # print(res.content)
                    res.failure(f"not ok: {res.status_code} {res.content}")
            except ConnectionError:
                res.failure("ConnectionError")
        return False

    def json_post(self, url, data):
        headers = {
            "Content-Type": "application/json",
        }
        if self.cookies is not None:
            headers["X-CSRFToken"] = self.cookies.get("OpenSlidesCsrfToken")

        return self.post(
            url,
            data=json.dumps(data),
            headers=headers,
            catch_response=True,
            cookies=self.cookies,
        )

    def post(self, *args, **kwargs):
        if not self.secure:
            wargs["verify"] = False
        return self.client.post(*args, **kwargs)
