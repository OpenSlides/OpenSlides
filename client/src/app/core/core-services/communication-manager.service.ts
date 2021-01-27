import { HttpParams } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { HttpService } from './http.service';
import { OfflineBroadcastService, OfflineReason } from './offline-broadcast.service';
import { OperatorService } from './operator.service';
import { SleepPromise } from '../promises/sleep';
import {
    CommunicationError,
    ErrorType,
    Stream,
    StreamContainer,
    StreamingCommunicationService,
    verboseErrorType
} from './streaming-communication.service';

type HttpParamsGetter = () => HttpParams | { [param: string]: string | string[] };

const MAX_STREAM_FAILURE_RETRIES = 3;

export class OfflineError extends Error {
    public constructor() {
        super('');
        this.name = 'OfflineError';
    }
}

interface StreamConnectionWrapper {
    id: number;
    url: string;
    messageHandler: (message: any) => void;
    params: HttpParamsGetter;
    stream?: Stream<any>;
    hasErroredAmount: number;
}

@Injectable({
    providedIn: 'root'
})
export class CommunicationManagerService {
    private communicationAllowed = false;

    private readonly _startCommunicationEvent = new EventEmitter<void>();

    public get startCommunicationEvent(): Observable<void> {
        return this._startCommunicationEvent.asObservable();
    }

    private readonly _stopCommunicationEvent = new EventEmitter<void>();

    public get stopCommunicationEvent(): Observable<void> {
        return this._stopCommunicationEvent.asObservable();
    }

    private streamContainers: { [id: number]: StreamContainer<any> } = {};

    public constructor(
        private streamingCommunicationService: StreamingCommunicationService,
        private offlineBroadcastService: OfflineBroadcastService,
        private http: HttpService,
        private operatorService: OperatorService
    ) {
        this.offlineBroadcastService.goOfflineObservable.subscribe(() => this.closeConnections());
    }

    public async subscribe<T>(
        url: string,
        messageHandler: (message: T) => void,
        params?: HttpParamsGetter
    ): Promise<() => void> {
        if (!params) {
            params = () => null;
        }

        const streamContainer = new StreamContainer(url, messageHandler, params);
        return await this.connectWithWrapper(streamContainer);
    }

    public startCommunication(): void {
        if (this.communicationAllowed) {
            console.error('Illegal state! Do not emit this event multiple times');
        } else {
            this.communicationAllowed = true;
            this._startCommunicationEvent.emit();
        }
    }

    private async connectWithWrapper<T>(streamContainer: StreamContainer<T>): Promise<() => void> {
        console.log('connect', streamContainer, streamContainer.stream);
        const errorHandler = (type: ErrorType, error: CommunicationError, message: string) =>
            this.handleError(streamContainer, type, error, message);
        this.streamingCommunicationService.subscribe(streamContainer, errorHandler);
        this.streamContainers[streamContainer.id] = streamContainer;
        return () => this.close(streamContainer);
    }

    private async handleError<T>(
        streamContainer: StreamContainer<T>,
        type: ErrorType,
        error: CommunicationError,
        message: string
    ): Promise<void> {
        console.log('handle Error', streamContainer, streamContainer.stream, verboseErrorType(type), error, message);
        streamContainer.stream.close();
        streamContainer.stream = null;

        streamContainer.hasErroredAmount++;
        if (streamContainer.hasErroredAmount > MAX_STREAM_FAILURE_RETRIES) {
            this.goOffline(streamContainer, OfflineReason.ConnectionLost);
        } else if (type === ErrorType.Client && error.type === 'auth_required') {
            this.goOffline(streamContainer, OfflineReason.WhoAmIFailed);
        } else {
            // retry it after some time:
            console.log(
                `Retry no. ${streamContainer.hasErroredAmount} of ${MAX_STREAM_FAILURE_RETRIES} for ${streamContainer.url}`
            );
            try {
                await this.delayAndCheckReconnection(streamContainer);
                await this.connectWithWrapper(streamContainer);
            } catch (e) {
                // delayAndCheckReconnection can throw an OfflineError,
                // which are just an 'abord mission' signal. Here, those errors can be ignored.
            }
        }
    }

    private async delayAndCheckReconnection<T>(streamContainer: StreamContainer<T>): Promise<void> {
        let delay;
        if (streamContainer.hasErroredAmount === 1) {
            delay = 500; // the first error has a small delay since these error can happen normally.
        } else {
            delay = Math.floor(Math.random() * 3000 + 2000);
        }
        console.log(`retry again in ${delay} ms`);

        await SleepPromise(delay);

        // do not continue, if we are offline!
        if (this.offlineBroadcastService.isOffline()) {
            console.log('we are offline?');
            throw new OfflineError();
        }

        // do not continue, if we are offline!
        if (!this.shouldRetryConnecting()) {
            console.log('operator changed, do not rety');
            throw new OfflineError(); // TODO: This error is not really good....
        }
    }

    public closeConnections(): void {
        for (const streamWrapper of Object.values(this.streamContainers)) {
            if (streamWrapper.stream) {
                streamWrapper.stream.close();
            }
        }
        this.streamContainers = {};
        this.communicationAllowed = false;
        this._stopCommunicationEvent.emit();
    }

    private goOffline<T>(streamContainer: StreamContainer<T>, reason: OfflineReason): void {
        delete this.streamContainers[streamContainer.id];
        this.closeConnections(); // here we close the connections early.
        this.offlineBroadcastService.goOffline(reason);
    }

    private close(streamConnectionWrapper: StreamConnectionWrapper): void {
        if (this.streamContainers[streamConnectionWrapper.id]) {
            this.streamContainers[streamConnectionWrapper.id].stream.close();
            delete this.streamContainers[streamConnectionWrapper.id];
        }
    }

    // Checks the operator: If we do not have a valid user,
    // do not even try to connect again..
    private shouldRetryConnecting(): boolean {
        return this.operatorService.guestsEnabled || !!this.operatorService.user;
    }

    public async isCommunicationServiceOnline(): Promise<boolean> {
        try {
            const response = await this.http.get<{ healthy: boolean }>('/system/health');
            return !!response.healthy;
        } catch (e) {
            return false;
        }
    }
}
