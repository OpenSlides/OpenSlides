from channels.routing import ProtocolTypeRouter, URLRouter
from django.conf.urls import url

from openslides.utils.consumers import CloseConsumer, SiteConsumer
from openslides.utils.middleware import AuthMiddlewareStack


application = ProtocolTypeRouter(
    {
        # WebSocket chat handler
        "websocket": AuthMiddlewareStack(
            URLRouter([url(r"^ws/$", SiteConsumer), url(".*", CloseConsumer)])
        )
    }
)
