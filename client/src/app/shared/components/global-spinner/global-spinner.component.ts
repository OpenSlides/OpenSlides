// External imports
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { ErrorInformation, OpenSlidesStatusService } from 'app/core/core-services/openslides-status.service';
import { OverlayService } from 'app/core/ui-services/overlay.service';

/**
 * Component for the global spinner.
 */
@Component({
    selector: 'os-global-spinner',
    templateUrl: './global-spinner.component.html',
    styleUrls: ['./global-spinner.component.scss']
})
export class GlobalSpinnerComponent implements OnInit, OnDestroy {
    /**
     * Text, which will be shown if the spinner is shown.
     */
    public text: string;

    /**
     * Flag, that defines when the spinner is shown.
     */
    public isVisible = false;

    /**
     * Subscription for the service to handle the visibility and text for the spinner.
     */
    private spinnerSubscription: Subscription;

    public error: ErrorInformation | null = null;

    /**
     * Constructor
     *
     * @param overlayService Reference to the service for this spinner.
     * @param translate Service to get translations for the messages.
     * @param cd Service to manual initiate a change of the UI.
     */
    public constructor(
        private overlayService: OverlayService,
        protected translate: TranslateService,
        private cd: ChangeDetectorRef,
        private statusService: OpenSlidesStatusService
    ) {
        this.statusService.currentError.subscribe(error => {
            this.error = error;
            this.cd.markForCheck();
        });
    }

    /**
     * Init method
     */
    public ngOnInit(): void {
        this.spinnerSubscription = this.overlayService // subscribe to the service.
            .getSpinner()
            .subscribe((value: { isVisible: boolean; text: string }) => {
                this.error = null;
                this.isVisible = value.isVisible;
                this.text = this.translate.instant(value.text);
                if (!this.text) {
                    this.text = this.translate.instant('Loading data. Please wait ...');
                }
                this.cd.detectChanges();
            });
    }

    /**
     * Destroy method
     *
     * Deletes the subscription and marks the spinner as invisible.
     */
    public ngOnDestroy(): void {
        if (this.spinnerSubscription) {
            this.spinnerSubscription.unsubscribe();
            this.isVisible = false;
        }
        this.spinnerSubscription = null;
        this.cd.detach();
    }
}
