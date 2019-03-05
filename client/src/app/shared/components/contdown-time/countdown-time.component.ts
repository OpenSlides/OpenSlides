import { Component, OnDestroy, Input, ApplicationRef } from '@angular/core';

import { ServertimeService } from 'app/core/core-services/servertime.service';

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
export class CountdownTimeComponent implements OnDestroy {
    /**
     * The time in seconds to make the countdown orange, is the countdown is below this value.
     */
    @Input()
    public warningTime: number;

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
            this.countdownInterval = this.applicationRef.isStable.subscribe(isStable => {
                if (isStable) {
                    setInterval(() => this.updateCountdownTime(), 0.5 * 1000);
                }
            });
        }
    }

    public get countdown(): CountdownData {
        return this._countdown;
    }

    public constructor(private servertimeService: ServertimeService,
        private applicationRef: ApplicationRef) {}

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
