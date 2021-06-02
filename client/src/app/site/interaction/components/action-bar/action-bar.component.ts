import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { fadeAnimation, fadeInOut } from 'app/shared/animations';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ApplauseService } from '../../services/applause.service';
import { CallRestrictionService } from '../../services/call-restriction.service';
import { InteractionService } from '../../services/interaction.service';
import { RtcService } from '../../services/rtc.service';

const canEnterTooltip = _('Enter conference room');
const cannotEnterTooltip = _('Add yourself to the current list of speakers to join the conference');
@Component({
    selector: 'os-action-bar',
    templateUrl: './action-bar.component.html',
    styleUrls: ['./action-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [fadeInOut, fadeAnimation]
})
export class ActionBarComponent extends BaseViewComponentDirective {
    public applauseLevel = 0;
    public applauseDisabled = false;

    public showApplause: Observable<boolean> = this.applauseService.showApplause;
    public applauseLevelObservable: Observable<number> = this.applauseService.applauseLevelObservable;
    public applauseTimeout = this.applauseService.applauseTimeout;
    public isJoined: Observable<boolean> = this.rtcService.isJoinedObservable;
    public showCallDialog: Observable<boolean> = this.rtcService.showCallDialogObservable;
    public showLiveConf: Observable<boolean> = this.interactionService.showLiveConfObservable;

    public isSupportEnabled: Observable<boolean> = this.rtcService.isSupportEnabled;

    private canEnterCallObservable: Observable<boolean> = this.callRestrictionService.canEnterCallObservable;
    public canEnterCall = false;

    /**
     * for the pulse animation
     */
    public enterCallAnimHelper = true;
    public meetingActiveAnimHelper = true;

    public get isConfStateStream(): Observable<boolean> {
        return this.interactionService.isConfStateStream;
    }

    public get isConfStateJitsi(): Observable<boolean> {
        return this.interactionService.isConfStateJitsi;
    }

    public get isConfStateNone(): Observable<boolean> {
        return this.interactionService.isConfStateNone;
    }

    public get enterRoomTooltip(): string {
        if (this.canEnterCall) {
            return _(canEnterTooltip);
        } else {
            return _(cannotEnterTooltip);
        }
    }

    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        private router: Router,
        private callRestrictionService: CallRestrictionService,
        private interactionService: InteractionService,
        private rtcService: RtcService,
        private applauseService: ApplauseService,
        private cd: ChangeDetectorRef
    ) {
        super(titleService, translate, matSnackBar);
        this.subscriptions.push(
            this.canEnterCallObservable.subscribe(canEnter => {
                this.canEnterCall = canEnter;
                this.cd.markForCheck();
            })
        );
    }

    public async enterConferenceRoom(canEnter: boolean): Promise<void> {
        if (canEnter) {
            this.interactionService
                .enterCall()
                .then(() => this.rtcService.enterConferenceRoom())
                .catch(this.raiseError);
        } else {
            const navUrl = '/autopilot';
            this.router.navigate([navUrl]);
        }
    }

    public enterSupportRoom(): void {
        this.interactionService
            .enterCall()
            .then(() => this.rtcService.enterSupportRoom())
            .catch(this.raiseError);
    }

    public maximizeCallDialog(): void {
        this.rtcService.showCallDialog = true;
    }

    public sendApplause(): void {
        this.applauseDisabled = true;
        this.applauseService.sendApplause();
        this.cd.markForCheck();
        setTimeout(() => {
            this.applauseDisabled = false;
            this.cd.markForCheck();
        }, this.applauseTimeout);
    }

    public triggerCallHiddenAnimation(): void {
        this.meetingActiveAnimHelper = !this.meetingActiveAnimHelper;
    }
}
