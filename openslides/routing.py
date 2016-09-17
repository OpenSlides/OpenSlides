from channels.routing import include, route

from openslides.utils.autoupdate import (
    send_data,
    ws_add_projector,
    ws_add_site,
    ws_disconnect_projector,
    ws_disconnect_site,
)

projector_routing = [
    route("websocket.connect", ws_add_projector),
    route("websocket.disconnect", ws_disconnect_projector),
]

site_routing = [
    route("websocket.connect", ws_add_site),
    route("websocket.disconnect", ws_disconnect_site),
]

channel_routing = [
    include(projector_routing, path=r'^/ws/projector/(?P<projector_id>\d+)/$'),
    include(site_routing, path=r'^/ws/site/$'),
    route("autoupdate.send_data", send_data),
]
