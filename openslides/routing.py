from channels.routing import route, include

from openslides.utils.autoupdate import send_data, ws_add_site, ws_add_projector, ws_disconnect_site, ws_disconnect_projector

projector_routing = [
    route("websocket.connect", ws_add_projector, path=r'^/(?P<projector_id>[0-9]+)/$'),
    route("websocket.disconnect", ws_disconnect_projector),
]

site_routing = [
    route("websocket.connect", ws_add_site),
    route("websocket.disconnect", ws_disconnect_site),
]

channel_routing = [
    route("websocket.connect", ws_add_projector, path=r'^/ws/projector/(?P<projector_id>[0-9]+)/$'),
    route("websocket.connect", ws_add_site, path=r'/ws/site/$'),
    route("websocket.disconnect", ws_disconnect_site),
    route("autoupdate.send_data", send_data),
]
