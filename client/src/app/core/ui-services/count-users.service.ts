import { Injectable } from '@angular/core';

import { Observable, Subject } from 'rxjs';

import { NotifyService } from '../core-services/notify.service';
import { OperatorService } from '../core-services/operator.service';

interface CountUserRequest {
    token: string;
}

interface CountUserResponse extends CountUserRequest {
    userId: number;
}

const REQUEST_NAME = 'count-user-request';
const RESPONSE_NAME = 'count-user-response';

/**
 * Provides functionality to count users with notify.
 * Sends requests to all active instances, which (hopefully) respond to this message.
 * Here, the answers will be collected and aggegated.
 */
@Injectable({
    providedIn: 'root'
})
export class CountUsersService {
    private activeCounts: { [token: string]: Subject<number> } = {};

    private currentUserId: number;

    /**
     * Sets up all listeners
     *
     * @param notifyService
     * @param operator
     */
    public constructor(private notifyService: NotifyService, operator: OperatorService) {
        // Listen for requests to send an answer.
        this.notifyService.getMessageObservable<CountUserRequest>(REQUEST_NAME).subscribe(request => {
            if (request.content.token) {
                this.notifyService.sendToChannels(
                    RESPONSE_NAME,
                    {
                        token: request.content.token,
                        userId: this.currentUserId
                    },
                    request.senderChannelName
                );
            }
        });

        // Listen for responses and distribute them through `activeCounts`
        this.notifyService.getMessageObservable<CountUserResponse>(RESPONSE_NAME).subscribe(response => {
            if (response.content.userId && response.content.token && this.activeCounts[response.content.token]) {
                this.activeCounts[response.content.token].next(response.content.userId);
            }
        });

        // Look for the current user.
        operator.getUserObservable().subscribe(user => (this.currentUserId = user ? user.id : null));
    }

    /**
     * @returns a generated track token to keep track of the counting.
     */
    private generateTrackToken(): string {
        let token = '';
        const characters = '0123456789abcdef';
        for (let i = 0; i < 32; i++) {
            token += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return token;
    }

    /**
     * Starts the counting process
     *
     * @returns a tuple: the first entry is a token, which can be used to stop the
     * counting with `stopCounting`. The second entry is an observable, where all user
     * ids will be published.
     */
    public countUsers(): [string, Observable<number>] {
        const trackToken = this.generateTrackToken();
        const subject = new Subject<number>();
        this.activeCounts[trackToken] = subject;
        this.notifyService.sendToAllUsers<CountUserRequest>(REQUEST_NAME, {
            token: trackToken
        });
        return [trackToken, this.activeCounts[trackToken].asObservable()];
    }

    /**
     * Stops an active counting by the provided token
     *
     * @param token The count to stop
     */
    public stopCounting(trackToken: string): void {
        if (this.activeCounts[trackToken]) {
            this.activeCounts[trackToken].complete();
            delete this.activeCounts[trackToken];
        }
    }
}
