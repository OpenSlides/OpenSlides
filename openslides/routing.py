from channels.routing import route

from openslides.utils.autoupdate import send_data, ws_add_site, ws_add_projector, ws_disconnect

channel_routing = [
    route("websocket.connect", ws_add_site, path=r'^/ws/site/$'),
    route("websocket.connect", ws_add_projector, path=r'^/ws/projector/(?P<projector_id>[0-9]+)/$'),
    route("websocket.disconnect", ws_disconnect),
    route("autoupdate.send_data", send_data),
]
