import { Injectable, NgZone, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

/**
 * A key value mapping for params, that should be appendet to the url on a new connection.
 */
interface QueryParams {
    [key: string]: string;
}

/**
 * The generic message format in which messages are send and recieved by the server.
 */
interface WebsocketMessage {
    type: string;
    content: any;
    id: string;
}

/**
 * Service that handles WebSocket connections. Other services can register themselfs
 * with {@method getOberservable} for a specific type of messages. The content will be published.
 */
@Injectable({
    providedIn: 'root'
})
export class WebsocketService {
    /**
     * The reference to the snackbar entry that is shown, if the connection is lost.
     */
    private connectionErrorNotice: MatSnackBarRef<SimpleSnackBar>;

    /**
     * Subjects that will be called, if a reconnect was successful.
     */
    private _reconnectEvent: EventEmitter<void> = new EventEmitter<void>();

    /**
     * Getter for the reconnect event.
     */
    public get reconnectEvent(): EventEmitter<void> {
        return this._reconnectEvent;
    }

    /**
     * Listeners will be nofitied, if the wesocket connection is establiched.
     */
    private _connectEvent: EventEmitter<void> = new EventEmitter<void>();

    /**
     * Getter for the connect event.
     */
    public get connectEvent(): EventEmitter<void> {
        return this._connectEvent;
    }

    /**
     * The websocket.
     */
    private websocket: WebSocket;

    /**
     * Subjects for types of websocket messages. A subscriber can get an Observable by {@function getOberservable}.
     */
    private subjects: { [type: string]: Subject<any> } = {};

    /**
     * Constructor that handles the router
     * @param router the URL Router
     */
    public constructor(
        private router: Router,
        private matSnackBar: MatSnackBar,
        private zone: NgZone,
        public translate: TranslateService
    ) {}

    /**
     * Creates a new WebSocket connection and handles incomming events.
     *
     * Uses NgZone to let all callbacks run in the angular context.
     */
    public connect(retry: boolean = false, changeId?: number): void {
        if (this.websocket) {
            return;
        }
        const queryParams: QueryParams = {};
        // comment-in if changes IDs are supported on server side.
        /*if (changeId !== undefined) {
            queryParams.changeId = changeId.toString();
        }*/

        // Create the websocket
        const socketProtocol = this.getWebSocketProtocol();
        const socketServer = window.location.hostname + ':' + window.location.port;
        const socketPath = this.getWebSocketPath(queryParams);
        this.websocket = new WebSocket(socketProtocol + socketServer + socketPath);

        // connection established. If this connect attept was a retry,
        // The error notice will be removed and the reconnectSubject is published.
        this.websocket.onopen = (event: Event) => {
            this.zone.run(() => {
                if (retry) {
                    if (this.connectionErrorNotice) {
                        this.connectionErrorNotice.dismiss();
                        this.connectionErrorNotice = null;
                    }
                    this._reconnectEvent.emit();
                }
                this._connectEvent.emit();
            });
        };

        this.websocket.onmessage = (event: MessageEvent) => {
            this.zone.run(() => {
                const message: WebsocketMessage = JSON.parse(event.data);
                const type: string = message.type;
                if (type === 'error') {
                    console.error('Websocket error', message.content);
                } else if (this.subjects[type]) {
                    // Pass the content to the registered subscribers.
                    this.subjects[type].next(message.content);
                } else {
                    console.log(`Got unknown websocket message type "${type}" with content`, message.content);
                }
            });
        };

        this.websocket.onclose = (event: CloseEvent) => {
            this.zone.run(() => {
                this.websocket = null;
                if (event.code !== 1000) {
                    // 1000 is a normal close, like the close on logout
                    if (!this.connectionErrorNotice) {
                        // So here we have a connection failure that wasn't intendet.
                        this.connectionErrorNotice = this.matSnackBar.open(
                            this.translate.instant('Offline mode: You can use OpenSlides but changes are not saved.'),
                            '',
                            { duration: 0 }
                        );
                    }

                    // A random retry timeout between 2000 and 5000 ms.
                    const timeout = Math.floor(Math.random() * 3000 + 2000);
                    setTimeout(() => {
                        this.connect((retry = true));
                    }, timeout);
                }
            });
        };
    }

    /**
     * Closes the websocket connection.
     */
    public close(): void {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
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
    public send<T>(type: string, content: T, id?: string): void {
        if (!this.websocket) {
            return;
        }

        const message: WebsocketMessage = {
            type: type,
            content: content,
            id: id
        };

        // create message id if not given. Required by the server.
        if (!message.id) {
            message.id = '';
            const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            for (let i = 0; i < 8; i++) {
                message.id += possible.charAt(Math.floor(Math.random() * possible.length));
            }
        }
        this.websocket.send(JSON.stringify(message));
    }

    /**
     * Delegates to socket-path for either the side or projector websocket.
     */
    private getWebSocketPath(queryParams: QueryParams = {}): string {
        // currentRoute does not end with '/'
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
     */
    private getWebSocketProtocol(): string {
        if (location.protocol === 'https') {
            return 'wss://';
        } else {
            return 'ws://';
        }
    }
}
