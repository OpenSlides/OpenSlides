import { Component, OnInit, OnDestroy } from '@angular/core';
import { BaseSlideComponent } from 'app/slides/base-slide-component';
import { ServertimeService } from 'app/core/core-services/servertime.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'os-core-clock-slide',
    templateUrl: './core-clock-slide.component.html',
    styleUrls: ['./core-clock-slide.component.scss']
})
export class CoreClockSlideComponent extends BaseSlideComponent<{}> implements OnInit, OnDestroy {
    public time: string;

    private servertimeSubscription: Subscription | null = null;

    public constructor(private servertimeService: ServertimeService) {
        super();
    }

    public ngOnInit(): void {
        // Update clock, when the server offset changes.
        this.servertimeSubscription = this.servertimeService
            .getServerOffsetObservable()
            .subscribe(() => this.updateClock());

        // Update clock every 10 seconds.
        setInterval(() => this.updateClock(), 10 * 1000);
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
    }
}
