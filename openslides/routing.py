from channels.routing import include, route

from openslides.utils.autoupdate import (
    send_data_projector,
    send_data_site,
    ws_add_projector,
    ws_add_site,
    ws_disconnect_projector,
    ws_disconnect_site,
    ws_receive_projector,
    ws_receive_site,
)

projector_routing = [
    route("websocket.connect", ws_add_projector),
    route("websocket.disconnect", ws_disconnect_projector),
    route("websocket.receive", ws_receive_projector),
]

site_routing = [
    route("websocket.connect", ws_add_site),
    route("websocket.disconnect", ws_disconnect_site),
    route("websocket.receive", ws_receive_site),
]

channel_routing = [
    include(projector_routing, path=r'^/ws/projector/(?P<projector_id>\d+)/$'),
    include(site_routing, path=r'^/ws/site/$'),
    route("autoupdate.send_data_projector", send_data_projector),
    route("autoupdate.send_data_site", send_data_site),
]
