import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'app/core/ui-services/config.service';
import { DurationService } from 'app/core/ui-services/duration.service';
import { BaseViewComponentDirective } from 'app/site/base/base-view';

/**
 * Countdown data for the form
 */
export interface CountdownData {
    title: string;
    description: string;
    duration: string;
    count?: number;
}

/**
 * Dialog component for countdowns
 */
@Component({
    selector: 'os-countdown-dialog',
    templateUrl: './countdown-dialog.component.html',
    styleUrls: ['./countdown-dialog.component.scss']
})
export class CountdownDialogComponent extends BaseViewComponentDirective implements OnInit {
    /**
     * The form data
     */
    public countdownForm: FormGroup;

    /**
     * Holds the default time which was set in the config
     */
    private defaultTime: number;

    /**
     * Constructor
     *
     * @param title Title service. Required by parent
     * @param matSnackBar Required by parent
     * @param configService Read out config variables
     * @param translate Required by parent
     * @param formBuilder To build the form
     * @param durationService Converts duration numbers to string
     * @param data The mat dialog data, contains the values to display (if any)
     */
    public constructor(
        title: Title,
        matSnackBar: MatSnackBar,
        configService: ConfigService,
        translate: TranslateService,
        private formBuilder: FormBuilder,
        private durationService: DurationService,
        @Inject(MAT_DIALOG_DATA) public data: CountdownData
    ) {
        super(title, translate, matSnackBar);
        this.defaultTime = configService.instant<number>('projector_default_countdown');
    }

    /**
     * Init. Creates the form
     */
    public ngOnInit(): void {
        const time = this.data.duration || this.durationService.durationToString(this.defaultTime, 'm');
        const title = this.data.title || `${this.translate.instant('Countdown')} ${this.data.count + 1}`;

        this.countdownForm = this.formBuilder.group({
            title: [title, Validators.required],
            description: [this.data.description],
            // TODO: custom form validation. This needs to be a valid minute duration
            duration: [time, Validators.required]
        });
    }
}
