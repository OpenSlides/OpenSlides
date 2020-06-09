import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { ServertimeService } from 'app/core/core-services/servertime.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { FontConfigObject } from 'app/core/ui-services/media-manage.service';

declare let FontFace: any;

export interface CountdownData {
    running: boolean;
    countdown_time: number;
}

/**
 * Displays the countdown time.
 */
@Component({
    selector: 'os-countdown-time',
    templateUrl: './countdown-time.component.html',
    styleUrls: ['./countdown-time.component.scss']
})
export class CountdownTimeComponent implements OnInit, OnDestroy {
    /**
     * The time in seconds to make the countdown orange, is the countdown is below this value.
     */
    @Input()
    public warningTime: number;

    /**
     * Boolean, whether the countdown will be displayed in a fullscreen-mode.
     */
    @Input()
    public fullscreen = false;

    /**
     * Passing a specific display-type will decide, whether either only the time-indicator
     * or only the countdown or both of them are displayed.
     *
     * @param displayType A string, that contains the preferred display-type.
     */
    @Input()
    public set displayType(displayType: string) {
        if (!displayType) {
            displayType = 'onlyCountdown';
        }
        this.showTimeIndicator = displayType === 'countdownAndTimeIndicator' || displayType === 'onlyTimeIndicator';
        this.showCountdown = displayType === 'onlyCountdown' || displayType === 'countdownAndTimeIndicator';
    }

    /**
     * Boolean to decide, if the time-indicator should be displayed.
     * Defaults to `false`.
     */
    public showTimeIndicator = false;

    /**
     * Boolean to decide, if the countdown should be displayed.
     * Defaults to `true`.
     */
    public showCountdown = true;

    /**
     * The amount of seconds to display
     */
    public seconds: number;

    /**
     * String formattet seconds.
     */
    public time: string;

    /**
     * The updateinterval.
     */
    private countdownInterval: any;

    private _countdown: CountdownData;

    /**
     * The needed data for the countdown.
     */
    @Input()
    public set countdown(data: CountdownData) {
        this._countdown = data;
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        if (data) {
            this.updateCountdownTime();
            this.countdownInterval = setInterval(() => this.updateCountdownTime(), 500);
        }
    }

    public get countdown(): CountdownData {
        return this._countdown;
    }

    public constructor(private servertimeService: ServertimeService, private configService: ConfigService) {}

    public ngOnInit(): void {
        this.configService.get<FontConfigObject>('font_monospace').subscribe(font => {
            if (font) {
                const customFont = new FontFace('OSFont Monospace', `url(${font.path || font.default})`);
                customFont
                    .load()
                    .then(res => {
                        (document as any).fonts.add(res);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            }
        });
    }

    /**
     * Updates the countdown time and string format it.
     */
    private updateCountdownTime(): void {
        if (this.countdown.running) {
            this.seconds = Math.floor(this.countdown.countdown_time - this.servertimeService.getServertime() / 1000);
        } else {
            this.seconds = this.countdown.countdown_time;
        }

        const negative = this.seconds < 0;
        let seconds = this.seconds;
        if (negative) {
            seconds = -seconds;
        }

        const time = new Date(seconds * 1000);
        const m = '0' + time.getMinutes();
        const s = '0' + time.getSeconds();

        this.time = m.slice(-2) + ':' + s.slice(-2);

        if (negative) {
            this.time = '-' + this.time;
        }
    }

    /**
     * Clear all pending intervals.
     */
    public ngOnDestroy(): void {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }
}
