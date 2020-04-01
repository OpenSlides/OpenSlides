import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

import { compress, decompress } from 'lz4js';
import { Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

import { OfflineService } from './offline.service';
import { OpenSlidesStatusService } from './openslides-status.service';
import { formatQueryParams, QueryParams } from '../definitions/query-params';

/**
 * The generic message format in which messages are send and recieved by the server.
 */
interface BaseWebsocketMessage {
    type: string;
    content: any;
}

/**
 * Outgoing messages must have an id.
 */
interface OutgoingWebsocketMessage extends BaseWebsocketMessage {
    id: string;
}

/**
 * Incomming messages may have an `in_response`, if they are an answer to a previously
 * submitted request.
 */
interface IncommingWebsocketMessage extends BaseWebsocketMessage {
    in_response?: string;
}

/**
 * The format of a messages content, if the message type is "error"
 */
interface WebsocketErrorContent {
    code: number;
    message: string;
}

function isWebsocketErrorContent(obj: any): obj is WebsocketErrorContent {
    return !!obj && obj.code !== undefined && obj.message !== undefined;
}

/**
 * All (custom) error codes that are used to pass error information
 * from the server to the client
 */
export const WEBSOCKET_ERROR_CODES = {
    NOT_AUTHORIZED: 100,
    CHANGE_ID_TOO_HIGH: 101,
    WRONG_FORMAT: 102
};

/*
 * Options for (re-)connecting.
 */
interface ConnectOptions {
    changeId?: number;
    enableAutoupdates?: boolean;
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
     * Subjects that will be called, if a reconnect after a retry (e.g. with a previous
     * connection loss) was successful.
     */
    private readonly _retryReconnectEvent: EventEmitter<void> = new EventEmitter<void>();

    /**
     * Getter for the retry reconnect event.
     */
    public get retryReconnectEvent(): EventEmitter<void> {
        return this._retryReconnectEvent;
    }

    /**
     * Subjects that will be called, if connect took place, but not a retry reconnect.
     * THis is the complement from the generalConnectEvent to the retryReconnectEvent.
     */
    private readonly _noRetryConnectEvent: EventEmitter<void> = new EventEmitter<void>();

    /**
     * Getter for the no-retry connect event.
     */
    public get noRetryConnectEvent(): EventEmitter<void> {
        return this._noRetryConnectEvent;
    }

    /**
     * Listeners will be nofitied, if the wesocket connection is establiched.
     */
    private readonly _generalConnectEvent: EventEmitter<void> = new EventEmitter<void>();

    /**
     * Getter for the connect event.
     */
    public get generalConnectEvent(): EventEmitter<void> {
        return this._generalConnectEvent;
    }

    /**
     * Listeners will be nofitied, if the wesocket connection is closed.
     */
    private readonly _closeEvent: EventEmitter<void> = new EventEmitter<void>();

    /**
     * Getter for the close event.
     */
    public get closeEvent(): EventEmitter<void> {
        return this._closeEvent;
    }

    /**
     * The subject for all websocket *message* errors (no connection errors).
     */
    private readonly _errorResponseSubject = new Subject<WebsocketErrorContent>();

    /**
     * The error response obersable for all websocket message errors.
     */
    public get errorResponseObservable(): Observable<WebsocketErrorContent> {
        return this._errorResponseSubject.asObservable();
    }

    /**
     * Saves, if the connection is open
     */
    private _connectionOpen = false;

    /**
     * Whether the WebSocket connection is established
     */
    public get isConnected(): boolean {
        return this._connectionOpen;
    }

    private sendQueueWhileNotConnected: (string | ArrayBuffer)[] = [];

    /**
     * The websocket.
     */
    private websocket: WebSocket | null;
    private websocketId: string | null;

    /**
     * Subjects for types of websocket messages. A subscriber can get an Observable by {@function getOberservable}.
     */
    private subjects: { [type: string]: Subject<any> } = {};

    /**
     * Callbacks for a waiting response. If any callback returns true, the message/error will not be propagated with the
     * responsible subjects for the message type.
     */
    private responseCallbacks: {
        [id: string]: [(val: any) => boolean, (error: WebsocketErrorContent) => boolean];
    } = {};

    /**
     * Saves, if the WS Connection should be closed (e.g. after an explicit `close()`). Prohibits
     * retry connection attempts.
     */
    private shouldBeClosed = true;

    /**
     * Counter for delaying the offline message.
     */
    private retryCounter = 0;

    /**
     * The timeout in the onClose-handler for the next reconnect retry.
     */
    private retryTimeout: any = null;

    /**
     * Constructor that handles the router
     *
     * @param zone
     * @param router
     * @param openSlidesStatusService
     * @param offlineService
     */
    public constructor(
        private zone: NgZone,
        private router: Router,
        private openSlidesStatusService: OpenSlidesStatusService,
        private offlineService: OfflineService
    ) {}

    /**
     * Creates a new WebSocket connection and handles incomming events.
     *
     * Uses NgZone to let all callbacks run in the angular context.
     */
    public async connect(options: ConnectOptions = {}, retry: boolean = false): Promise<void> {
        const websocketId = Math.random().toString(36).substring(7);
        this.websocketId = websocketId;

        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }

        if (!retry) {
            this.shouldBeClosed = false;
        }

        // set defaults
        options = Object.assign(options, {
            enableAutoupdates: true
        });

        const queryParams: QueryParams = {
            autoupdate: options.enableAutoupdates
        };

        if (options.changeId !== undefined) {
            queryParams.change_id = options.changeId;
        }

        // Create the websocket
        let socketPath = location.protocol === 'https:' ? 'wss://' : 'ws://';
        socketPath += window.location.host;
        if (this.openSlidesStatusService.isPrioritizedClient) {
            socketPath += '/prioritize';
        }
        socketPath += '/ws/';
        socketPath += formatQueryParams(queryParams);

        this.websocket = new WebSocket(socketPath);
        this.websocket.binaryType = 'arraybuffer';

        // connection established. If this connect attept was a retry,
        // The error notice will be removed and the reconnectSubject is published.
        this.websocket.onopen = (event: Event) => {
            if (this.websocketId !== websocketId) {
                return;
            }
            this.zone.run(() => {
                this.retryCounter = 0;

                if (this.shouldBeClosed) {
                    this.offlineService.goOnline();
                    return;
                }

                this._connectionOpen = true;
                if (retry) {
                    this.offlineService.goOnline();
                    this._retryReconnectEvent.emit();
                } else {
                    this._noRetryConnectEvent.emit();
                }
                this._generalConnectEvent.emit();
                this.sendQueueWhileNotConnected.forEach(entry => {
                    this.websocket.send(entry);
                });
                this.sendQueueWhileNotConnected = [];
            });
        };

        this.websocket.onmessage = (event: MessageEvent) => {
            if (this.websocketId !== websocketId) {
                return;
            }
            this.zone.run(() => {
                this.handleMessage(event.data);
            });
        };

        this.websocket.onclose = (event: CloseEvent) => {
            if (this.websocketId !== websocketId) {
                return;
            }
            this.zone.run(() => {
                this.onclose();
            });
        };

        this.websocket.onerror = (event: ErrorEvent) => {
            if (this.websocketId !== websocketId) {
                return;
            }
            // place for proper error handling and debugging.
            // Required to get more information about errors
            this.zone.run(() => {
                console.warn('WS error event:', event);
            });
        };
    }

    /**
     * Handles an incomming message.
     *
     * @param data The message
     */
    private handleMessage(data: string | ArrayBuffer): void {
        if (data instanceof ArrayBuffer) {
            const compressedSize = data.byteLength;
            const decompressedBuffer: Uint8Array = decompress(new Uint8Array(data));
            console.debug(
                `Recieved ${compressedSize / 1024} KB (${
                    decompressedBuffer.byteLength / 1024
                } KB uncompressed), ratio ${decompressedBuffer.byteLength / compressedSize}`
            );
            data = this.arrayBufferToString(decompressedBuffer);
        }

        const message: IncommingWebsocketMessage = JSON.parse(data);
        console.debug('Received', message);
        const type = message.type;
        const inResponse = message.in_response;
        const callbacks = this.responseCallbacks[inResponse];
        if (callbacks) {
            delete this.responseCallbacks[inResponse];
        }

        if (type === 'error') {
            if (!isWebsocketErrorContent(message.content)) {
                console.error('Websocket error without standard form!', message);
                return;
            }

            // Print this to the console.
            const error = message.content;
            const errorDescription =
                Object.keys(WEBSOCKET_ERROR_CODES).find(key => WEBSOCKET_ERROR_CODES[key] === error.code) ||
                'unknown code';
            console.error(`Websocket error with code=${error.code} (${errorDescription}):`, error.message);

            // call the error callback, if there is any. If it returns true (means "handled"),
            // the errorResponseSubject will not be called
            if (inResponse && callbacks && callbacks[1] && callbacks[1](error)) {
                return;
            }
            this._errorResponseSubject.next(error);
            return;
        }

        // Try to fire a response callback directly. If it returnes true, the message is handeled
        // and not distributed further
        if (inResponse && callbacks && callbacks[0](message.content)) {
            return;
        }

        if (this.subjects[type]) {
            // Pass the content to the registered subscribers.
            this.subjects[type].next(message.content);
        } else {
            console.warn(
                `Got unknown websocket message type "${type}" (inResponse: ${inResponse}) with content`,
                message.content
            );
        }
    }

    /**
     * Closes the connection error notice
     */
    private onclose(): void {
        if (this.websocket) {
            this.websocketId = null; // set to null, so now further events will be
            // registered with the line below.
            this.websocket.close(); // Cleanup old connection
            this.websocket = null;
        }
        this._connectionOpen = false;
        // 1000 is a normal close, like the close on logout
        this._closeEvent.emit();
        if (!this.shouldBeClosed) {
            // Do not show the message snackbar on the projector
            // tests for /projector and /projector/<id>
            const onProjector = this.router.url.match(/^\/projector(\/[0-9]+\/?)?$/);
            if (this.retryCounter <= 3) {
                this.retryCounter++;
            }

            if (!this.connectionErrorNotice && !onProjector && this.retryCounter > 3) {
                this.offlineService.goOfflineBecauseConnectionLost();
            }

            // A random retry timeout between 2000 and 5000 ms.
            const timeout = Math.floor(Math.random() * 3000 + 2000);
            this.retryTimeout = setTimeout(() => {
                this.retryTimeout = null;
                this.connect({ enableAutoupdates: true }, true);
            }, timeout);
        }
    }

    public cancelReconnectenRetry(): void {
        if (this.retryTimeout) {
            clearTimeout(this.retryTimeout);
            this.retryTimeout = null;
        }
    }

    /**
     * Closes the websocket connection.
     */
    public async close(): Promise<void> {
        this.shouldBeClosed = true;
        this.offlineService.goOnline();
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
            await this.closeEvent.pipe(take(1)).toPromise();
        }
    }

    /**
     * Simulates an abnormal close.
     *
     * Internally does not set `shouldBeClosed`, so a reconnect is forced.
     */
    public simulateAbnormalClose(): void {
        this.onclose();
    }

    /**
     * closes and reopens the connection. If the connection was closed before,
     * it will be just opened.
     *
     * @param options The options for the new connection
     */
    public async reconnect(options: ConnectOptions = {}): Promise<void> {
        await this.close();
        await this.connect(options);
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
     * @param success an optional success callback for a response. If it returns true, the message will not be
     * propagated through the recieve subjects.
     * @param error an optional error callback for a response. If it returns true, the error will not be propagated
     * with the error subject.
     * @param id an optional id for the message. If not given, a random id will be generated and returned.
     * @returns the message id
     */
    public send<T, R>(
        type: string,
        content: T,
        success?: (val: R) => boolean,
        error?: (error: WebsocketErrorContent) => boolean,
        id?: string
    ): string {
        if (!this.websocket) {
            return;
        }

        const message: OutgoingWebsocketMessage = {
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

        if (success) {
            this.responseCallbacks[message.id] = [success, error];
        }

        const jsonMessage = JSON.stringify(message);
        const bytesMessage = this.stringToBuffer(jsonMessage);

        const compressedMessage: ArrayBuffer = compress(bytesMessage);
        const ratio = bytesMessage.byteLength / compressedMessage.byteLength;

        const toSend = ratio > 1 ? compressedMessage : jsonMessage;

        if (this.isConnected) {
            this.websocket.send(toSend);
        } else {
            this.sendQueueWhileNotConnected.push(toSend);
        }

        return message.id;
    }

    /**
     * Sends a message and waits for the response
     *
     * @param type the message type
     * @param content the actual content
     * @param id an optional id for the message. If not given, a random id will be generated and returned.
     */
    public sendAndGetResponse<T, R>(type: string, content: T, id?: string): Promise<R> {
        return new Promise<R>((resolve, reject) => {
            this.send<T, R>(
                type,
                content,
                val => {
                    resolve(val);
                    return true;
                },
                val => {
                    reject(val);
                    return true;
                },
                id
            );
        });
    }

    /**
     * Converts an ArrayBuffer to a String.
     *
     * @param buffer - Buffer to convert
     * @returns String
     */
    private arrayBufferToString(buffer: Uint8Array): string {
        return Array.from(buffer)
            .map(code => String.fromCharCode(code))
            .join('');
    }

    /**
     * Converts a String to an ArrayBuffer.
     *
     * @param str - String to convert.
     * @returns bufferView.
     */
    private stringToBuffer(str: string): Uint8Array {
        const bufferView = new Uint8Array();
        for (let i = 0; i < str.length; i++) {
            bufferView[i] = str.charCodeAt(i);
        }
        return bufferView;
    }
}
