import { Injectable } from '@angular/core';

import { ConstantsService } from './constants.service';
import { Deferred } from '../promises/deferred';
import { TimeoutPromise } from '../promises/timeout-promise';
import { WebsocketService } from './websocket.service';

interface OpenSlidesSettings {
    PING_INTERVAL?: number;
    PING_TIMEOUT?: number;
}

@Injectable({
    providedIn: 'root'
})
export class PingService {
    /**
     * The interval.
     */
    private pingInterval: any;

    private intervalTime = 30000;

    private timeoutTime = 5000;

    private lastLatency: number | null = null;

    public constructor(private websocketService: WebsocketService, private constantsService: ConstantsService) {
        this.setup();
    }

    private async setup(): Promise<void> {
        const gotConstants = new Deferred();

        this.constantsService.get<OpenSlidesSettings>('Settings').subscribe(settings => {
            this.intervalTime = settings.PING_INTERVAL || 30000;
            this.timeoutTime = settings.PING_TIMEOUT || 5000;
            gotConstants.resolve();
        });
        await gotConstants;

        // Connects the ping-pong mechanism to the opening and closing of the connection.
        this.websocketService.closeEvent.subscribe(() => this.stopPing());
        this.websocketService.generalConnectEvent.subscribe(() => this.startPing());
        if (this.websocketService.isConnected) {
            this.startPing();
        }
    }

    /**
     * Starts the ping-mechanism
     */
    private startPing(): void {
        if (this.pingInterval) {
            return;
        }

        this.pingInterval = setInterval(async () => {
            const start = performance.now();
            try {
                await TimeoutPromise(
                    this.websocketService.sendAndGetResponse('ping', this.lastLatency),
                    this.timeoutTime
                );
                this.lastLatency = performance.now() - start;
                if (this.lastLatency > 1000) {
                    console.warn(`Ping took ${this.lastLatency / 1000} seconds.`);
                }
            } catch (e) {
                console.warn(`The server didn't respond to ping within ${this.timeoutTime / 1000} seconds.`);
                this.stopPing();
                this.websocketService.simulateAbnormalClose();
            }
        }, this.intervalTime);
    }

    /**
     * Clears the ping interval
     */
    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}
