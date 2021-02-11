## Do requests to stress the server

Setup:

    python3 -m venv .venv
    source .venv/bin/activate
    pip install -U -r requirements.txt

## Basic test invocation

The main tool is locust. It supports a webinterface, but we'll use the headless
version here. A ``secrets`` file is needed, see the main README. Example:

    locust --headless -f server/presence.py -r 10 -u 100

Parameters:

- `-r`: The hatch-rate: The amount of users spawned per seconds until `-u` is reached
- `-u`: The amount of users (locust terminology for a client) to spawn

## Available tests
### presence.py
Logs in a user once and then sets the presence randomly to true or false every
second. The interval can be changed in the ``server/presence.py`` with
``wait_time``. See the docs:
https://docs.locust.io/en/stable/writing-a-locustfile.html#wait-time-attribute

### voting.py
This is untested and experimental! If you want to use it, see the source code.
