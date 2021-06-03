import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { ConfigService } from 'app/core/ui-services/config.service';
import { CallRestrictionService } from './call-restriction.service';
import { RtcService } from './rtc.service';
import { StreamService } from './stream.service';

export enum ConferenceState {
    none = 1,
    stream = 2,
    jitsi = 3
}

@Injectable({
    providedIn: 'root'
})
export class InteractionService {
    private conferenceStateSubject = new BehaviorSubject<ConferenceState>(ConferenceState.none);
    public conferenceStateObservable = this.conferenceStateSubject.asObservable();
    public showLiveConfObservable: Observable<boolean> = this.configService.get<boolean>(
        'general_system_conference_show'
    );
    private get conferenceState(): ConferenceState {
        return this.conferenceStateSubject.value;
    }

    private isInCall: boolean;

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
        combineLatest(
            this.showLiveConfObservable,
            this.streamService.hasLiveStreamUrlObvervable,
            this.streamService.canSeeLiveStreamObservable,
            this.rtcService.isJitsiEnabledObservable,
            this.rtcService.isJoinedObservable,
            this.rtcService.isJitsiActiveObservable,
            this.callRestrictionService.canEnterCallObservable,
            (showConf, hasStreamUrl, canSeeStream, jitsiEnabled, inCall, jitsiActive, canEnterCall) => {
                this.isInCall = inCall;

                /**
                 * most importantly, if there is a call, to not change the state here
                 */
                if (inCall || jitsiActive) {
                    return;
                }
                if (hasStreamUrl && canSeeStream) {
                    return ConferenceState.stream;
                } else if (showConf && jitsiEnabled && canEnterCall && (!hasStreamUrl || !canSeeStream)) {
                    return ConferenceState.jitsi;
                } else {
                    return ConferenceState.none;
                }
            }
        )
            .pipe(distinctUntilChanged())
            .subscribe(state => {
                if (state) {
                    this.setConferenceState(state);
                }
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
}
