#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    Benchmark test script for OpenSlides.

    :copyright: 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

import argparse
import multiprocessing
import random
import signal
import sys
import time
import urlparse

import pycurl

URL_SETS = {
    "projector": [
        dict(
            path = "/projector/",
            headers = [
                "X-Requested-With: XMLHttpRequest",
            ]
        ),
    ],
    "home": [
        "/",
        "/jsi18n/",
        "/static/styles/base.css",
        "/static/javascript/utils.js",
        "/static/javascript/jquery.min.js",
        "/static/img/logo.png",
    ],
    "agenda": [
        "/agenda/",
        "/static/styles/base.css",
        "/static/styles/tabledrag.css",
        "/static/javascript/utils.js",
        "/static/styles/agenda.css",
        "/static/javascript/jquery.min.js",
        "/jsi18n/",
    ],
    "application": [
        "/application/",
        "/static/styles/base.css",
        "/static/javascript/utils.js",
        "/static/javascript/jquery.min.js",
        "/jsi18n/",
    ]
}


def nop_write(data):
    return len(data)

class Client(object):
    def __init__(self):
        self._c = pycurl.Curl()
        self._c.setopt(pycurl.FAILONERROR, 1)
        self._c.setopt(pycurl.FOLLOWLOCATION, 1)
        self._c.setopt(pycurl.TIMEOUT, 10)
        self._c.setopt(pycurl.WRITEFUNCTION, nop_write)
        self._c.setopt(pycurl.AUTOREFERER, 1)


    def request(self, r):
        if isinstance(r, basestring):
            self._c.setopt(pycurl.URL, r)
        else:
            self._c.setopt(pycurl.URL, r["url"])
            self._c.setopt(pycurl.HTTPHEADER, r["headers"])

        try:
            self._c.perform()
        except pycurl.error as e:
            return False
        return True


def request_loop(pause, repeat, urls, should_quit):
    c = Client()

    requests, errors = 0, 0
    max_time = 0
    sum_time = 0

    urls = list(urls)
    random.shuffle(urls)

    for x in xrange(repeat):
        if should_quit.value:
            break
        if pause:
            time.sleep(pause)
        for url in urls:
            if should_quit.value:
                break

            requests += 1
            t0 = time.time()
            if not c.request(url):
                errors += 1
            t1 = time.time()

            dt = t1 - t0
            sum_time += dt
            if dt > max_time:
                max_time = dt

    return requests, errors, max_time, sum_time


def worker(params, should_quit, lock):
    signal.signal(signal.SIGINT, signal.SIG_IGN)

    opts = params["opts"]

    pause = opts.pause / 1000.0
    res = request_loop(pause, opts.repeat, params["urls"], should_quit)
    with lock:
        params["requests"].value += res[0]
        params["errors"].value += res[1]
        params["max_request_time"].value = max((res[2], params["max_request_time"].value))
        params["sum_request_time"].value += res[3]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-d", "--delay", type = int, default = 100)
    parser.add_argument("-j", "--jobs", type = int, default = 10)
    parser.add_argument("-p", "--pause", type = int, default = 500)
    parser.add_argument("-r", "--repeat", type = int, default = 100)
    parser.add_argument("-s", "--url-set", choices = list(URL_SETS),
        default = "projector")
    parser.add_argument("base_url")

    opts = parser.parse_args()

    base_url = opts.base_url
    urls = []
    for u in URL_SETS[opts.url_set]:
        if isinstance(u, basestring):
            u = urlparse.urljoin(base_url, u)
        else:
            u["url"] = urlparse.urljoin(base_url, u["path"])
        urls.append(u)

    data = dict(
        opts = opts,
        urls = urls,

        requests = multiprocessing.Value("i", 0),
        errors = multiprocessing.Value("i", 0),
        max_request_time = multiprocessing.Value("d", 0),
        sum_request_time = multiprocessing.Value("d", 0),
    )

    lock = multiprocessing.Lock()
    quit = multiprocessing.Value("i", 0)

    t0 = time.time()

    workers = []
    for job in xrange(opts.jobs):
        p = multiprocessing.Process(target = worker,
            args = (data, quit, lock))
        p.daemon = True
        p.start()
        workers.append(p)

        # spread out the start of each worker a bit
        delay = opts.delay
        if delay != 0:
            if delay < 0:
                time.sleep(random.randint(0, -delay) / 1000.0)
            else:
                time.sleep(delay / 1000.0)

    try:
        for p in workers:
            p.join()
    except KeyboardInterrupt:
        quit.value = 1
        for p in workers:
            p.join()

    t1 = time.time()

    data["total_time"] = t1 - t0
    data["avg_request_time"] = data["sum_request_time"].value / data["requests"].value
    print("Total Requests: {requests.value}\n"
        "Errors: {errors.value}\n"
        "Jobs: {opts.jobs}\n"
        "Time: {total_time:.1f}s\n"
        "Max time per request: {max_request_time.value:.4f}s\n"
        "Avg time per request: {avg_request_time:.4f}s\n".format(**data))



if __name__ == "__main__":
    main()
