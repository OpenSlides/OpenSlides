from channels.routing import route

from openslides.utils.autoupdate import send_data, ws_add, ws_disconnect

channel_routing = [
    route("websocket.connect", ws_add, path='/ws/'),
    route("websocket.disconnect", ws_disconnect),
    route("autoupdate.send_data", send_data),
]
