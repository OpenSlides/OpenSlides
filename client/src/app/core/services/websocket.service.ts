import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject } from 'rxjs';

interface QueryParams {
    [key: string]: string;
}

interface WebsocketMessage {
    type: string;
    content: any;
    id: string;
}

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
    private websocketSubject: WebSocketSubject<WebsocketMessage>;

    /**
     * Subjects for types of websocket messages. A subscriber can get an Observable by {@function getOberservable}.
     */
    private subjects: { [type: string]: Subject<any> } = {};

    /**
     * Creates a new WebSocket connection as WebSocketSubject
     *
     * Can return old Subjects to prevent multiple WebSocket connections.
     */
    public connect(changeId?: number): void {
        const queryParams: QueryParams = {};
        // comment-in if changes IDs are supported on server side.
        /*if (changeId !== undefined) {
            queryParams.changeId = changeId.toString();
        }*/

        const socketProtocol = this.getWebSocketProtocol();
        const socketServer = window.location.hostname + ':' + window.location.port;
        const socketPath = this.getWebSocketPath(queryParams);
        if (!this.websocketSubject) {
            this.websocketSubject = webSocket(socketProtocol + socketServer + socketPath);
            // directly subscribe. The messages are distributes below
            this.websocketSubject.subscribe(message => {
                const type: string = message.type;
                if (type === 'error') {
                    console.error('Websocket error', message.content);
                } else if (this.subjects[type]) {
                    this.subjects[type].next(message.content);
                } else {
                    console.log(`Got unknown websocket message type "${type}" with content`, message.content);
                }
            });
        }
    }

    /**
     * Returns an observable for messages of the given type.
     * @param type the message type
     */
    public getOberservable<T>(type: string): Observable<T> {
        if (!this.subjects[type]) {
            this.subjects[type] = new Subject<T>();
        }
        return this.subjects[type].asObservable();
    }

    /**
     * Sends a message to the server with the content and the given type.
     *
     * @param type the message type
     * @param content the actual content
     */
    public send<T>(type: string, content: T): void {
        if (!this.websocketSubject) {
            return;
        }

        const message: WebsocketMessage = {
            type: type,
            content: content,
            id: ''
        };

        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        for (let i = 0; i < 8; i++) {
            message.id += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        this.websocketSubject.next(message);
    }

    /**
     * Delegates to socket-path for either the side or projector websocket.
     */
    private getWebSocketPath(queryParams: QueryParams = {}): string {
        //currentRoute does not end with '/'
        const currentRoute = this.router.url;
        let path: string;
        if (currentRoute.includes('/projector') || currentRoute.includes('/real-projector')) {
            path = '/ws/projector/';
        } else {
            path = '/ws/site/';
        }

        const keys: string[] = Object.keys(queryParams);
        if (keys.length > 0) {
            path += keys
                .map(key => {
                    return key + '=' + queryParams[key];
                })
                .join('&');
        }
        return path;
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
