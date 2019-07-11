// External imports
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ProgressSpinnerMode } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { OverlayService, SpinnerConfig } from 'app/core/ui-services/overlay.service';

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
     * Defines the mode of the spinner. In `'determinate'-mode` a value can be passed to the spinner.
     */
    public mode: ProgressSpinnerMode = 'indeterminate';

    /**
     * Defines the diameter of the spinner. Defaults to `140`.
     */
    public diameter = 140;

    /**
     * Defines the stroke-width of the spinner. Defaults to `10`.
     */
    public stroke = 10;

    /**
     * If the `'determinate'-mode` is applied, a value can be given to the spinner to indicate a progress.
     */
    public value: number;

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

    /**
     * Constant string as default message when the spinner is shown.
     */
    private LOADING = this.translate.instant('Loading data. Please wait ...');

    /**
     *
     * @param overlayService Reference to the service for this spinner.
     * @param translate Service to get translations for the messages.
     * @param cd Service to manual initiate a change of the UI.
     */
    public constructor(
        private overlayService: OverlayService,
        protected translate: TranslateService,
        private cd: ChangeDetectorRef
    ) {}

    /**
     * Init method
     */
    public ngOnInit(): void {
        this.spinnerSubscription = this.overlayService // subscribe to the service.
            .getSpinner()
            .subscribe((value: { isVisible: boolean; text: string; config?: SpinnerConfig }) => {
                this.isVisible = value.isVisible;
                this.text = this.translate.instant(value.text);
                if (!this.text) {
                    this.text = this.LOADING;
                }
                if (value.config) {
                    this.setConfig(value.config);
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
    }

    /**
     * Function to set properties to the spinner.
     *
     * @param config The `SpinnerConfig`.
     */
    private setConfig(config?: SpinnerConfig): void {
        this.mode = config.mode || this.mode;
        this.diameter = config.diameter || this.diameter;
        this.stroke = config.stroke || this.stroke;
        this.value = config.value || this.value;
    }
}
