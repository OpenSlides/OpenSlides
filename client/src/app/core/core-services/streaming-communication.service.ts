import {
    HttpClient,
    HttpDownloadProgressEvent,
    HttpEvent,
    HttpHeaderResponse,
    HttpHeaders,
    HttpParams
} from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable, Subscription } from 'rxjs';

import { HTTPMethod } from '../definitions/http-methods';

const HEADER_EVENT_TYPE = 2;
const PROGRESS_EVENT_TYPE = 3;
const FINISH_EVENT_TYPE = 4;

export type Params = HttpParams | { [param: string]: string | string[] };
export enum ErrorType {
    Client,
    Server, // or network errors, they are the same.
    Unknown
}
export function verboseErrorType(type: ErrorType): string {
    switch (type) {
        case ErrorType.Client:
            return 'Client';
        case ErrorType.Server:
            return 'Server';
        case ErrorType.Unknown:
            return 'Unknown';
    }
}
export interface CommunicationError {
    type: string;
    msg: string;
}
export function isCommunicationError(obj: any): obj is CommunicationError {
    const _obj = obj as CommunicationError;
    return typeof obj === 'object' && typeof _obj.msg === 'string' && typeof _obj.type === 'string';
}
interface CommunicationErrorWrapper {
    error: CommunicationError;
}
export function isCommunicationErrorWrapper(obj: any): obj is CommunicationErrorWrapper {
    return typeof obj === 'object' && isCommunicationError(obj.error);
}
export type ErrorHandler = (type: ErrorType, error: CommunicationError, message: string) => void;

export class StreamConnectionError extends Error {
    public constructor(public code: number, message: string) {
        super(message);
        this.name = 'StreamConnectionError';
    }
}

export class StreamContainer<T> {
    public readonly id = Math.floor(Math.random() * (900000 - 1) + 100000); // [100000, 999999]

    public messageHandler: (message: T) => void;

    public hasErroredAmount = 0;

    public stream?: Stream<T>;

    public constructor(public url: string, messageHandler: (message: T) => void, public params: () => Params) {
        this.messageHandler = (message: T) => {
            // {connected: true} is a special message just to trigger the code below
            if ((<any>message).connected) {
                console.log(`resetting error amount for ${this.url} since there was a connect message`);
                this.hasErroredAmount = 0;
            } else {
                messageHandler(message);
            }
        };
    }
}

export class Stream<T> {
    private subscription: Subscription = null;

    private hasError = false;
    private reportedError = false;

    private _statuscode: number;
    public get statuscode(): number {
        return this._statuscode;
    }

    private _errorContent: CommunicationError;
    public get errorContent(): CommunicationError {
        return this._errorContent;
    }

    /**
     * This is the index where we checked, if there is a \n in the read buffer (event.partialText)
     * This position is always >= contentStartIndex and is > contentStartIndex, if the message
     * was too big to fit into one buffer. So we have just a partial message.
     *
     * The difference between this index and contentStartIndex is that this index remembers the position
     * we checked for a \n which lay in the middle of the next JOSN-packet.
     */
    private checkedUntilIndex = 0;

    /**
     * This index holds always the position of the current JOSN-packet, that we are receiving.
     */
    private contentStartIndex = 0;

    private closed = false;

    public constructor(
        observable: Observable<HttpEvent<string>>,
        private messageHandler: (message: T) => void,
        private errorHandler: ErrorHandler
    ) {
        this.subscription = observable.subscribe(
            (event: HttpEvent<string>) => {
                if (this.closed) {
                    return;
                }
                if (event.type === HEADER_EVENT_TYPE) {
                    const headerResponse = event as HttpHeaderResponse;
                    this._statuscode = headerResponse.status;
                    if (headerResponse.status >= 400) {
                        this.hasError = true;
                    }
                } else if ((<HttpEvent<string>>event).type === PROGRESS_EVENT_TYPE) {
                    this.handleMessage(event as HttpDownloadProgressEvent);
                } else if ((<HttpEvent<string>>event).type === FINISH_EVENT_TYPE) {
                    this.errorHandler(ErrorType.Server, null, 'The stream was closed');
                }
            },
            error => {
                this.errorHandler(ErrorType.Server, error, 'Network error');
            },
            () => {
                console.log('The stream was completed');
            }
        );
    }

    private handleMessage(event: HttpDownloadProgressEvent): void {
        if (this.hasError) {
            if (!this.reportedError) {
                this.reportedError = true;
                // try to get the `error` key from object
                this._errorContent = this.tryParseError(event.partialText);
                this.errorHandler(this.getErrorTypeFromStatusCode(), this._errorContent, 'Reported error by server');
            }
            return;
        }
        // Maybe we get multiple messages, so continue, until the complete buffer is checked.
        while (this.checkedUntilIndex < event.loaded) {
            // check if there is a \n somewhere in [checkedUntilIndex, ...]
            const LF_index = event.partialText.indexOf('\n', this.checkedUntilIndex);

            if (LF_index >= 0) {
                // take string in [contentStartIndex, LF_index-1]. This must be valid JSON.
                // In substring, the last character is exlusive.
                const content = event.partialText.substring(this.contentStartIndex, LF_index);

                // move pointer: next JSON starts at LF_index + 1
                this.checkedUntilIndex = LF_index + 1;
                this.contentStartIndex = LF_index + 1;

                const parsedContent = this.tryParseJson(content);
                if (isCommunicationError(parsedContent)) {
                    if (this.hasError && this.reportedError) {
                        return;
                    }
                    this.hasError = true;
                    this._errorContent = parsedContent;
                    // Do not trigger the error handler, if the connection-retry-routine is still handling this issue
                    if (!this.reportedError) {
                        this.reportedError = true;
                        console.error(this._errorContent);
                        this.errorHandler(
                            this.getErrorTypeFromStatusCode(),
                            this._errorContent,
                            'Reported error by server'
                        );
                    }
                    return;
                } else {
                    console.debug('received', parsedContent);
                    this.messageHandler(parsedContent);
                }
            } else {
                this.checkedUntilIndex = event.loaded;
            }
        }
    }

    private getErrorTypeFromStatusCode(): ErrorType {
        if (!this.statuscode) {
            return ErrorType.Unknown;
        }
        if (this.statuscode >= 400 && this.statuscode < 500) {
            return ErrorType.Client;
        }
        if (this.statuscode >= 500) {
            return ErrorType.Server;
        }
        return ErrorType.Unknown;
    }

    private tryParseJson(json: string): T | CommunicationError {
        try {
            return JSON.parse(json) as T;
        } catch (e) {
            return this.tryParseError(json);
        }
    }

    /**
     * This one is a bit tricky. Error can be:
     * - string with HTML, e.g. provided by proxies if the service is unreachable
     * - string with json of form {"error": {"type": ..., "msg": ...}}
     */
    private tryParseError(error: any): CommunicationError {
        if (typeof error === 'string') {
            try {
                error = JSON.parse(error);
            } catch (e) {
                return { type: 'Unknown Error', msg: error };
            }
        }

        if (isCommunicationErrorWrapper(error)) {
            return error.error;
        } else if (isCommunicationError(error)) {
            return error;
        }

        // we have something else.... ??
        console.error('Unknown error', error);
        throw new Error('Unknown error: ' + error.toString());
    }

    public close(): void {
        this.subscription.unsubscribe();
        this.subscription = null;
        this.closed = true;
    }
}

@Injectable({
    providedIn: 'root'
})
export class StreamingCommunicationService {
    public constructor(private http: HttpClient) {}

    public subscribe<T>(streamContainer: StreamContainer<T>, errorHandler: ErrorHandler): void {
        const options: {
            body?: any;
            headers?: HttpHeaders | { [header: string]: string | string[] };
            observe: 'events';
            params?: HttpParams | { [param: string]: string | string[] };
            reportProgress?: boolean;
            responseType: 'text';
            withCredentials?: boolean;
        } = {
            headers: {
                'Content-Type': 'application/json',
                'ngsw-bypass': 'yes'
            },
            responseType: 'text',
            observe: 'events',
            reportProgress: true
        };
        const params = streamContainer.params();
        if (params) {
            options.params = params;
        }
        const observable = this.http.request(HTTPMethod.GET, streamContainer.url, options);

        if (streamContainer.stream) {
            console.error('Illegal state!');
        }

        const stream = new Stream<T>(observable, streamContainer.messageHandler, errorHandler);
        streamContainer.stream = stream;
    }
}
