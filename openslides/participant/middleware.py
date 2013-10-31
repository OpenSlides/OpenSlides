# -*- coding: utf-8 -*-

from django.contrib.auth.middleware import AuthenticationMiddleware as _AuthenticationMiddleware
from django.contrib.auth.models import AnonymousUser


class AuthenticationMiddleware(_AuthenticationMiddleware):
    def process_request(self, request):
        super(AuthenticationMiddleware, self).process_request(request)

        if not isinstance(request.user, AnonymousUser):
            request.user = request.user.user
