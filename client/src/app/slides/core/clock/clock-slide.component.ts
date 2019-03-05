import { Component, OnInit, OnDestroy, ApplicationRef } from '@angular/core';

import { Subscription } from 'rxjs';

import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { ServertimeService } from 'app/core/core-services/servertime.service';
import { SelectMultipleControlValueAccessor } from '@angular/forms';
import { SELECT_PANEL_INDENT_PADDING_X } from '@angular/material';

@Component({
    selector: 'os-clock-slide',
    templateUrl: './clock-slide.component.html',
    styleUrls: ['./clock-slide.component.scss']
})
export class ClockSlideComponent extends BaseSlideComponent<{}> implements OnInit, OnDestroy {
    public time: string;

    private servertimeSubscription: Subscription | null = null;

    private clockInterval: any;

    public constructor(private servertimeService: ServertimeService, private applicationRef: ApplicationRef) {
        super();
    }

    public ngOnInit(): void {
        // Update clock, when the server offset changes.
        this.servertimeSubscription = this.servertimeService
            .getServerOffsetObservable()
            .subscribe(() => this.updateClock());

        // Update clock every 10 seconds.
        this.clockInterval = this.applicationRef.isStable.subscribe(isStable => {
            if (isStable) {
                setInterval(() => this.updateClock(), 10 * 1000);
            }
        });
    }

    private updateClock(): void {
        const time = new Date(this.servertimeService.getServertime());
        const hours = '0' + time.getHours();
        const minutes = '0' + time.getMinutes();

        // Will display time in hh:mm format
        this.time = hours.slice(-2) + ':' + minutes.slice(-2);
    }

    public ngOnDestroy(): void {
        if (this.servertimeSubscription) {
            this.servertimeSubscription.unsubscribe();
        }
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
    }
}
