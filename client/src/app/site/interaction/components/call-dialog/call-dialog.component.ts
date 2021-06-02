import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Output,
    ViewChild
} from '@angular/core';

import { Observable } from 'rxjs';

import { ViewportService } from 'app/core/ui-services/viewport.service';
import { RtcService } from '../../services/rtc.service';

@Component({
    selector: 'os-call-dialog',
    templateUrl: './call-dialog.component.html',
    styleUrls: ['./call-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CallDialogComponent implements AfterViewInit {
    @ViewChild('jitsi')
    private jitsiNode: ElementRef;

    public jitsiMeetUrl: Observable<string> = this.rtcService.jitsiMeetUrl;

    public isMobile: Observable<boolean> = this.vp.isMobileSubject;

    public constructor(private cd: ChangeDetectorRef, private rtcService: RtcService, private vp: ViewportService) {}

    public ngAfterViewInit(): void {
        this.rtcService.setJitsiNode(this.jitsiNode);
        this.cd.markForCheck();
    }

    public fullScreen(): void {
        this.rtcService.enterFullScreen();
        this.cd.markForCheck();
    }

    public hangUp(): void {
        this.rtcService.stopJitsi();
        this.cd.markForCheck();
    }

    public hideDialog(): void {
        this.rtcService.showCallDialog = false;
    }
}
