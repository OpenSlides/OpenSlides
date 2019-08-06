import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Moment } from 'moment';
import { distinctUntilChanged } from 'rxjs/operators';

import { BaseComponent } from 'app/base.component';
import { ConfigRepositoryService } from 'app/core/repositories/config/config-repository.service';
import { ParentErrorStateMatcher } from 'app/shared/parent-error-state-matcher';
import { ViewConfig } from '../../models/view-config';

/**
 * Component for a config field, used by the {@link ConfigListComponent}. Handles
 * all input types defined by the server, as well as updating the configs
 *
 * @example
 * ```ts
 * <os-config-field [item]="item.config"></os-config-field>
 * ```
 */
@Component({
    selector: 'os-config-field',
    templateUrl: './config-field.component.html',
    styleUrls: ['./config-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None // to style the date and time pickers
})
export class ConfigFieldComponent extends BaseComponent implements OnInit {
    public configItem: ViewConfig;

    /**
     * Option to show a green check-icon.
     */
    public updateSuccessIcon = false;

    /**
     * The timeout for the success icon to hide.
     */
    private updateSuccessIconTimeout: number | null = null;

    /**
     * The debounce timeout for inputs request delay.
     */
    private debounceTimeout: number | null = null;

    /**
     * A possible error send by the server.
     */
    public error: string | null = null;

    /**
     * Translated config value for template
     */
    public translatedValue: object;

    /**
     * The config item for this component. Just accepts components with already
     * populated constants-info.
     */
    @Input()
    public set item(value: ViewConfig) {
        if (value && value.hasConstantsInfo) {
            this.configItem = value;

            if (this.form) {
                if (this.configItem.inputType === 'datetimepicker') {
                    // datetime has to be converted
                    const datetimeObj = this.unixToDateAndTime(this.configItem.value as number);
                    this.form.patchValue(datetimeObj, { emitEvent: false });
                } else {
                    this.form.patchValue(
                        {
                            value: this.configItem.value
                        },
                        { emitEvent: false }
                    );
                }
            }
        }
    }

    /**
     * The form for this configItem.
     */
    public form: FormGroup;

    /**
     * The matcher for custom (request) errors.
     */
    public matcher = new ParentErrorStateMatcher();

    /**
     * The usual component constructor. datetime pickers will set their locale
     * to the current language chosen
     *
     * @param titleService Title
     * @param translate TranslateService
     * @param formBuilder FormBuilder
     * @param cd ChangeDetectorRef
     * @param repo ConfigRepositoryService
     */
    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private formBuilder: FormBuilder,
        private cd: ChangeDetectorRef,
        public repo: ConfigRepositoryService
    ) {
        super(titleService, translate);
    }

    /**
     * Sets up the form for this config field.
     */
    public ngOnInit(): void {
        this.form = this.formBuilder.group({
            value: [''],
            date: [''],
            time: ['']
        });
        this.translatedValue = this.configItem.value;
        if (
            this.configItem.inputType === 'string' ||
            this.configItem.inputType === 'markupText' ||
            this.configItem.inputType === 'text'
        ) {
            if (typeof this.configItem.value === 'string' && this.configItem.value !== '') {
                this.translatedValue = this.translate.instant(this.configItem.value);
            }
        }
        if (this.configItem.inputType === 'datetimepicker' && this.configItem.value) {
            const datetimeObj = this.unixToDateAndTime(this.configItem.value as number);
            this.form.patchValue(datetimeObj);
        }
        this.form.patchValue({
            value: this.translatedValue
        });
        this.form.valueChanges
            // The editor fires changes whenever content was changed. Even by AutoUpdate.
            // This checks for discting content
            .pipe(distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
            .subscribe(form => {
                this.onChange(form.value);
            });
    }

    /**
     * Helper function to split a unix timestamp into a date as a moment object and a time string in the form of HH:SS
     *
     * @param unix the timestamp
     *
     * @return an object with a date and a time field
     */
    private unixToDateAndTime(unix: number): { date: Moment; time: string } {
        const date = moment.unix(unix);
        const time = date.hours() + ':' + date.minutes();
        return { date: date, time: time };
    }

    /**
     * Helper function to fuse a moment object as the date part and a time string (HH:SS) as the time part.
     *
     * @param date the moment date object
     * @param time the time string
     *
     * @return a unix timestamp
     */
    private dateAndTimeToUnix(date: Moment, time: string): number {
        if (date) {
            if (time) {
                const timeSplit = time.split(':');
                // + is faster than parseint and number(). ~~ would be fastest but prevented by linter...
                date.hour(+timeSplit[0]);
                date.minute(+timeSplit[1]);
            }
            return date.unix();
        } else {
            return null;
        }
    }

    /**
     * Trigger an update of the data
     */
    private onChange(value: any): void {
        if (this.configItem.inputType === 'markupText') {
            // tinyMCE markuptext does not autoupdate on change, only when entering or leaving
            return;
        }
        if (this.configItem.inputType === 'datetimepicker') {
            // datetime has to be converted
            const date = this.form.get('date').value;
            const time = this.form.get('time').value;
            value = this.dateAndTimeToUnix(date, time);
        }
        if (this.debounceTimeout !== null) {
            clearTimeout(<any>this.debounceTimeout);
        }
        this.debounceTimeout = <any>setTimeout(() => {
            this.update(value);
        }, this.configItem.getDebouncingTimeout());
        this.cd.detectChanges();
    }

    /**
     * Triggers a reset to the default value (if a default value is present)
     */
    public onResetButton(): void {
        if (this.configItem.defaultValue !== undefined) {
            this.onChange(this.configItem.defaultValue);
        }
    }

    /**
     * Sends an update request for the config item to the server.
     * @param value The new value to set.
     */
    private update(value: any): void {
        this.debounceTimeout = null;
        this.repo.update({ value: value }, this.configItem).then(() => {
            this.error = null;
            this.showSuccessIcon();
        }, this.setError.bind(this));
    }

    /**
     * Show the green success icon on the component. The icon gets automatically cleared.
     */
    private showSuccessIcon(): void {
        if (this.updateSuccessIconTimeout !== null) {
            clearTimeout(<any>this.updateSuccessIconTimeout);
        }
        this.updateSuccessIconTimeout = <any>setTimeout(() => {
            this.updateSuccessIcon = false;
            if (!this.wasViewDestroyed()) {
                this.cd.detectChanges();
            }
        }, 2000);
        this.updateSuccessIcon = true;
        if (!this.wasViewDestroyed()) {
            this.cd.detectChanges();
        }
    }

    /**
     * @returns true, if the view was destroyed. Note: This
     * needs to access internal attributes from the change detection
     * reference.
     */
    private wasViewDestroyed(): boolean {
        return (<any>this.cd).destroyed;
    }

    /**
     * Sets the error on this field.
     *
     * @param error The error as string.
     */
    private setError(error: string): void {
        this.error = error;
        this.form.setErrors({ error: true });
        this.cd.detectChanges();
    }

    /**
     * Uses the configItem to determine the kind of interation:
     * input, textarea, choice or date
     *
     * @param type: the type of a config item
     *
     * @returns the template type
     */
    public formType(type: string): string {
        switch (type) {
            case 'integer':
                return 'number';
            case 'colorpicker':
                return 'color';
            default:
                return 'text';
        }
    }

    /**
     * Checks of the config.type can be part of the form
     *
     * @param type the config.type of a setting
     *
     * @returns wheather it should be excluded or not
     */
    public isExcludedType(type: string): boolean {
        const excluded = ['boolean', 'markupText', 'text', 'translations', 'datetimepicker'];
        return excluded.includes(type);
    }

    /**
     * Determines if a reset buton should be offered.
     * TODO: is 'null' a valid default in some cases?
     *
     * @returns true if any default exists
     */
    public hasDefault(): boolean {
        return this.configItem.defaultValue !== undefined && this.configItem.defaultValue !== null;
    }

    /**
     * Amends the application-wide tinyMCE settings with update triggers that
     * send updated values only after leaving focus (Blur) or closing the editor (Remove)
     *
     * @returns an instance of tinyMCE settings with additional setup definitions
     */
    public getTinyMceSettings(): object {
        return {
            ...this.tinyMceSettings,
            setup: editor => {
                editor.on('Blur', ev => {
                    if (ev.target.getContent() !== this.translatedValue) {
                        this.update(ev.target.getContent());
                    }
                });
                editor.on('Remove', ev => {
                    if (ev.target.getContent() !== this.translatedValue) {
                        this.update(ev.target.getContent());
                    }
                });
            }
        };
    }
}
