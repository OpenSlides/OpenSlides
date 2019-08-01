import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';

import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { ProgressMode, ProgressService } from 'app/core/ui-services/progress.service';

/**
 * Component to show the progress announced in the progress service in a snack bar
 * component
 */
@Component({
    selector: 'os-progress-snack-bar',
    templateUrl: './progress-snack-bar.component.html',
    styleUrls: ['./progress-snack-bar.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressSnackBarComponent implements OnInit, OnDestroy {
    /**
     * Private declaration of the mode
     */
    private _mode: ProgressMode = 'indeterminate';

    /**
     * Private declaration of the progress message
     */
    private _message = '';

    /**
     * Private declaration of the value
     */
    private _value = 0;

    /**
     * The sub for the info
     */
    private infoSubscription: Subscription;

    /**
     * The sub for the amount
     */
    private valueSubscription: Subscription;

    /**
     * Public getter of the progress bar mode
     */
    public get mode(): ProgressMode {
        return this._mode;
    }

    /**
     * Public getter of the progress bar message. Will be trasnslated in the UIs
     */
    public get message(): string {
        return this._message;
    }

    /**
     * Public getter for the progress value
     */
    public get value(): number {
        return this._value;
    }

    /**
     * Declare the progressService
     */
    public constructor(private progressService: ProgressService, private cd: ChangeDetectorRef) {}

    /**
     * Get the progress subject and subscribe to the info subject
     */
    public ngOnInit(): void {
        this.infoSubscription = this.progressService.info.subscribe(info => {
            this._message = info.text;
            this._mode = info.mode;
            this.cd.detectChanges();
        });

        this.valueSubscription = this.progressService.amount.pipe(distinctUntilChanged()).subscribe(value => {
            if (value - this._value >= 5 || value === 100) {
                this._value = value;
                this.cd.detectChanges();
            }
        });
    }

    /**
     * clear the Subscriptions
     */
    public ngOnDestroy(): void {
        if (this.infoSubscription) {
            this.infoSubscription.unsubscribe();
            this.infoSubscription = null;
        }

        if (this.valueSubscription) {
            this.valueSubscription.unsubscribe();
            this.valueSubscription = null;
        }
    }
}
