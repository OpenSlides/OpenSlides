import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    HostListener,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ApplauseService } from '../../services/applause.service';
import { CallRestrictionService } from '../../services/call-restriction.service';
import { InteractionService } from '../../services/interaction.service';
import { RtcService } from '../../services/rtc.service';
import { StreamService } from '../../services/stream.service';

const helpDeskTitle = _('Help desk');
const liveConferenceTitle = _('Conference room');
const disconnectedTitle = _('disconnected');
const connectingTitle = _('connecting ...');

@Component({
    selector: 'os-call',
    templateUrl: './call.component.html',
    styleUrls: ['./call.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CallComponent extends BaseViewComponentDirective implements OnInit, AfterViewInit, OnDestroy {
    public isJitsiActiveInAnotherTab: Observable<boolean> = this.rtcService.inOtherTab;
    public canEnterCall: Observable<boolean> = this.callRestrictionService.canEnterCallObservable;
    public isJitsiDialogOpen: Observable<boolean> = this.rtcService.showCallDialogObservable;

    public isJitsiActive: boolean;
    public isJoined: boolean;

    public get showHangUp(): boolean {
        return this.isJitsiActive && this.isJoined;
    }

    private dominantSpeaker: string;
    private members = {};
    public get memberList(): string[] {
        return Object.keys(this.members);
    }

    public get isDisconnected(): boolean {
        return !this.isJitsiActive && !this.isJoined;
    }

    public get isConnecting(): boolean {
        return this.isJitsiActive && !this.isJoined;
    }

    public get isConnected(): boolean {
        return this.isJitsiActive && this.isJoined;
    }

    public get showParticles(): Observable<boolean> {
        return this.applauseService.showParticles;
    }

    public get canSeeLiveStream(): Observable<boolean> {
        return this.streamService.canSeeLiveStreamObservable;
    }

    public get liveStreamUrl(): Observable<string> {
        return this.streamService.liveStreamUrlObservable;
    }

    private autoConnect: boolean;

    @Output()
    public conferenceTitle: EventEmitter<string> = new EventEmitter();

    @Output()
    public conferenceSubtitle: EventEmitter<string> = new EventEmitter();

    public constructor(
        titleService: Title,
        translate: TranslateService,
        snackBar: MatSnackBar,
        private callRestrictionService: CallRestrictionService,
        private rtcService: RtcService,
        private applauseService: ApplauseService,
        private interactionService: InteractionService,
        private streamService: StreamService,
        private cd: ChangeDetectorRef
    ) {
        super(titleService, translate, snackBar);

        this.subscriptions.push(
            this.rtcService.isJitsiActiveObservable.subscribe(active => {
                this.isJitsiActive = active;
                this.updateSubtitle();
                this.cd.markForCheck();
            }),

            this.rtcService.isJoinedObservable.subscribe(isJoined => {
                this.isJoined = isJoined;
                this.updateSubtitle();
                this.cd.markForCheck();
            }),

            this.rtcService.memberObservableObservable.subscribe(members => {
                this.members = members;
                this.cd.markForCheck();
            }),

            this.rtcService.dominantSpeakerObservable.subscribe(domSpeaker => {
                this.dominantSpeaker = domSpeaker?.displayName;
                this.updateSubtitle();
                this.cd.markForCheck();
            }),

            this.rtcService.autoConnect.subscribe(auto => {
                this.autoConnect = auto;
            }),

            this.rtcService.connectedToHelpDesk.subscribe(onHelpDesk => {
                if (onHelpDesk) {
                    this.conferenceTitle.next(helpDeskTitle);
                } else {
                    this.conferenceTitle.next(liveConferenceTitle);
                }
                this.cd.markForCheck();
            })
        );
    }

    public ngOnInit(): void {
        this.updateSubtitle();
    }

    public ngAfterViewInit(): void {
        if (this.autoConnect) {
            this.callRoom();
        }
    }

    // closing the tab should also try to stop jitsi.
    // this will usually not be caught by ngOnDestroy
    @HostListener('window:beforeunload', ['$event'])
    public beforeunload($event: any): void {
        this.rtcService.stopJitsi();
    }

    public ngOnDestroy(): void {
        super.ngOnDestroy();
        this.rtcService.stopJitsi();
    }

    private updateSubtitle(): void {
        if (this.isJitsiActive && this.isJoined) {
            this.conferenceSubtitle.next(this.dominantSpeaker || '');
        } else if (this.isJitsiActive && !this.isJoined) {
            this.conferenceSubtitle.next(connectingTitle);
        } else {
            this.conferenceSubtitle.next(disconnectedTitle);
        }
    }

    public async callRoom(): Promise<void> {
        await this.rtcService.enterConferenceRoom().catch(this.raiseError);
        this.cd.markForCheck();
    }

    public forceStart(): void {
        this.rtcService.enterConferenceRoom(true).catch(this.raiseError);
        this.cd.markForCheck();
    }

    public hangUp(): void {
        this.rtcService.stopJitsi();
        this.cd.markForCheck();
    }

    public viewStream(): void {
        this.interactionService.viewStream();
    }
}
