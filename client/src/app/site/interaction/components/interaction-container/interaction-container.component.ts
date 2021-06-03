import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { combineLatest, forkJoin, merge, Observable } from 'rxjs';
import { distinctUntilChanged, filter, mergeAll, mergeMap, withLatestFrom } from 'rxjs/operators';

import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ApplauseService } from '../../services/applause.service';
import { InteractionService } from '../../services/interaction.service';
import { RtcService } from '../../services/rtc.service';
import { StreamService } from '../../services/stream.service';

@Component({
    selector: 'os-interaction-container',
    templateUrl: './interaction-container.component.html',
    styleUrls: ['./interaction-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InteractionContainerComponent extends BaseViewComponentDirective implements OnInit {
    public showBody = false;

    private streamRunning = false;
    private streamLoadedOnce = false;

    public containerHeadTitle = '';
    public containerHeadSubtitle = '';

    public get isApplausEnabled(): Observable<boolean> {
        return this.applauseService.showApplause;
    }

    public get showApplauseBar(): Observable<boolean> {
        return this.applauseService.showBar;
    }

    public get isConfStateStream(): Observable<boolean> {
        return this.interactionService.isConfStateStream;
    }

    public get isConfStateJitsi(): Observable<boolean> {
        return this.interactionService.isConfStateJitsi;
    }

    public get isConfStateNone(): Observable<boolean> {
        return this.interactionService.isConfStateNone;
    }

    public get isStreamInOtherTab(): boolean {
        return !this.streamRunning && this.streamLoadedOnce;
    }

    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackBar: MatSnackBar,
        rtcService: RtcService,
        streamService: StreamService,
        private interactionService: InteractionService,
        private applauseService: ApplauseService,
        private cd: ChangeDetectorRef
    ) {
        super(titleService, translate, matSnackBar);
        this.subscriptions.push(
            rtcService.showCallDialogObservable.subscribe(show => {
                if (show) {
                    this.showBody = false;
                }
                this.cd.markForCheck();
            }),
            streamService.streamLoadedOnceObservable.subscribe(loadedOnce => {
                this.streamLoadedOnce = loadedOnce;
                if (!this.isStreamInOtherTab) {
                    this.showBody = true;
                }
                this.cd.markForCheck();
            }),
            streamService.isStreamRunningObservable.subscribe(running => {
                this.streamRunning = running || false;
                if (!this.isStreamInOtherTab) {
                    this.showBody = true;
                }
                this.cd.markForCheck();
            })
        );
    }

    public ngOnInit(): void {
        this.subscriptions.push(
            this.interactionService.conferenceStateObservable.pipe(distinctUntilChanged()).subscribe(state => {
                if (state) {
                    this.clearTitles();
                }
            })
        );
    }

    private clearTitles(): void {
        this.containerHeadTitle = '';
        this.containerHeadSubtitle = '';
        this.cd.markForCheck();
        this.cd.detectChanges();
    }

    public showHideBody(): void {
        this.showBody = !this.showBody;
    }

    public updateTitle(title: string): void {
        if (title !== this.containerHeadTitle) {
            this.containerHeadTitle = title ?? '';
            this.cd.markForCheck();
        }
    }

    public updateSubtitle(title: string): void {
        if (title !== this.containerHeadSubtitle) {
            this.containerHeadSubtitle = title ?? '';
            this.cd.markForCheck();
        }
    }
}
