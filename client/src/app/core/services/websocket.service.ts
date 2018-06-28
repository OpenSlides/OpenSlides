import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
    providedIn: 'root'
})
export class WebsocketService {
    constructor(private router: Router) {}

    //might be any for simplicity or MessageEvent or something different
    private subject: WebSocketSubject<any>;

    public connect(): WebSocketSubject<any> {
        const socketProtocol = this.getWebSocketProtocoll();
        const socketPath = this.getWebSocketPath();
        const socketServer = window.location.hostname + ':' + window.location.port;
        if (!this.subject) {
            this.subject = webSocket(socketProtocol + socketServer + socketPath);
        }
        return this.subject;
    }

    // delegates to websockets for either the side or projector websocket
    private getWebSocketPath(): string {
        //currentRoute does not end with '/'
        const currentRoute = this.router.url;
        if (currentRoute.includes('/projector') || currentRoute.includes('/real-projector')) {
            return '/ws/projector';
        } else {
            return '/ws/site/';
        }
    }

    // returns the websocket protocoll
    private getWebSocketProtocoll(): string {
        if (location.protocol === 'https') {
            return 'wss://';
        } else {
            return 'ws://';
        }
    }
}
