import { Injectable } from '@angular/core';

import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfigService } from 'app/core/ui-services/config.service';
import { CallRestrictionService } from './call-restriction.service';
import { RtcService } from './rtc.service';
import { StreamService } from './stream.service';

export enum ConferenceState {
    none,
    stream,
    jitsi
}

@Injectable({
    providedIn: 'root'
})
export class InteractionService {
    private conferenceStateSubject = new BehaviorSubject<ConferenceState>(ConferenceState.none);
    public conferenceStateObservable = this.conferenceStateSubject.asObservable();
    public showLiveConfObservable: Observable<boolean>;
    private get conferenceState(): ConferenceState {
        return this.conferenceStateSubject.value;
    }

    private isJitsiEnabled: boolean;
    private isInCall: boolean;
    private isJitsiActive: boolean;
    private hasLiveStreamUrl: boolean;
    private canSeeLiveStream: boolean;
    private showLiveConf: boolean;

    public get isConfStateStream(): Observable<boolean> {
        return this.conferenceStateObservable.pipe(map(state => state === ConferenceState.stream));
    }

    public get isConfStateJitsi(): Observable<boolean> {
        return this.conferenceStateObservable.pipe(map(state => state === ConferenceState.jitsi));
    }

    public get isConfStateNone(): Observable<boolean> {
        return this.conferenceStateObservable.pipe(map(state => state === ConferenceState.none));
    }

    public constructor(
        private configService: ConfigService,
        private streamService: StreamService,
        private rtcService: RtcService,
        private callRestrictionService: CallRestrictionService
    ) {
        this.showLiveConfObservable = this.configService.get<boolean>('general_system_conference_show');

        /**
         * If you want to somehow simplify this using rxjs merge-map magic or something
         * be my guest.
         */
        this.streamService.liveStreamUrlObservable.subscribe(url => {
            this.hasLiveStreamUrl = !!url?.trim() ?? false;
            this.detectDeadState();
        });

        this.streamService.canSeeLiveStreamObservable.subscribe(canSee => {
            this.canSeeLiveStream = canSee;
            this.detectDeadState();
        });

        this.rtcService.isJitsiEnabledObservable.subscribe(enabled => {
            this.isJitsiEnabled = enabled;
            this.detectDeadState();
        });

        this.rtcService.isJoinedObservable.subscribe(joined => {
            this.isInCall = joined;
            this.detectDeadState();
        });

        this.rtcService.isJitsiActiveObservable.subscribe(isActive => {
            this.isJitsiActive = isActive;
            this.detectDeadState();
        });

        this.callRestrictionService.hasToEnterCallObservable.subscribe(() => {
            if (!this.isInCall) {
                this.enterCall();
                this.rtcService.enterConferenceRoom();
            }
        });

        this.callRestrictionService.hasToLeaveCallObservable.subscribe(() => {
            this.viewStream();
        });

        this.showLiveConfObservable.subscribe(showConf => {
            this.showLiveConf = showConf;
            this.detectDeadState();
        });

        this.detectDeadState();
    }

    public async enterCall(): Promise<void> {
        if (this.conferenceState !== ConferenceState.jitsi) {
            this.setConferenceState(ConferenceState.jitsi);
        }
    }

    public viewStream(): void {
        if (this.conferenceState !== ConferenceState.stream) {
            this.setConferenceState(ConferenceState.stream);
        }
    }

    private setConferenceState(newState: ConferenceState): void {
        if (newState !== this.conferenceState) {
            this.conferenceStateSubject.next(newState);
        }
    }

    /**
     * this is the "dead" state; you would see the jitsi state; but are not connected
     * or the connection is prohibited. If this occurs and a live stream
     * becomes available, switch to the stream state
     */
    private detectDeadState(): void {
        if (
            this.isInCall === undefined ||
            this.isJitsiActive === undefined ||
            this.hasLiveStreamUrl === undefined ||
            this.conferenceState === undefined ||
            this.canSeeLiveStream === undefined ||
            this.isJitsiEnabled === undefined
        ) {
            return;
        }

        /**
         * most importantly, if there is a call, to not change the state!
         */
        if (this.isInCall || this.isJitsiActive) {
            return;
        }

        if (this.hasLiveStreamUrl && this.canSeeLiveStream) {
            this.viewStream();
        } else if (this.showLiveConf && (!this.hasLiveStreamUrl || !this.canSeeLiveStream) && this.isJitsiEnabled) {
            this.enterCall();
        } else {
            this.setConferenceState(ConferenceState.none);
        }
    }
}
