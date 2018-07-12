import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

/**
 * Service that handles WebSocket connections.
 *
 * Creates or returns already created WebSockets.
 */
@Injectable({
    providedIn: 'root'
})
export class WebsocketService {
    /**
     * Constructor that handles the router
     * @param router the URL Router
     */
    constructor(private router: Router) {}

    /**
     * Observable subject that might be `any` for simplicity, `MessageEvent` or something appropriate
     */
    private subject: WebSocketSubject<any>;

    /**
     * Creates a new WebSocket connection as WebSocketSubject
     *
     * Can return old Subjects to prevent multiple WebSocket connections.
     */
    public connect(): WebSocketSubject<any> {
        const socketProtocol = this.getWebSocketProtocol();
        const socketPath = this.getWebSocketPath();
        const socketServer = window.location.hostname + ':' + window.location.port;
        if (!this.subject) {
            this.subject = webSocket(socketProtocol + socketServer + socketPath);
        }
        return this.subject;
    }

    /**
     * Delegates to socket-path for either the side or projector websocket.
     */
    private getWebSocketPath(): string {
        //currentRoute does not end with '/'
        const currentRoute = this.router.url;
        if (currentRoute.includes('/projector') || currentRoute.includes('/real-projector')) {
            return '/ws/projector';
        } else {
            return '/ws/site/';
        }
    }

    /**
     * returns the desired websocket protocol
     *
     * TODO: HTTPS is not yet tested
     */
    private getWebSocketProtocol(): string {
        if (location.protocol === 'https') {
            return 'wss://';
        } else {
            return 'ws://';
        }
    }
}
