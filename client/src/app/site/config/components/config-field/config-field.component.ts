import { Component, OnInit, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { distinctUntilChanged } from 'rxjs/operators';

import { DateTimeAdapter } from 'ng-pick-datetime';
import { TranslateService } from '@ngx-translate/core';

import { BaseComponent } from '../../../../base.component';
import { ConfigRepositoryService } from '../../services/config-repository.service';
import { ParentErrorStateMatcher } from 'app/shared/parent-error-state-matcher';
import { ViewConfig } from '../../models/view-config';

/**
 * List view for the categories.
 *
 * TODO: Creation of new Categories
 */
@Component({
    selector: 'os-config-field',
    templateUrl: './config-field.component.html',
    styleUrls: ['./config-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigFieldComponent extends BaseComponent implements OnInit {
    public configItem: ViewConfig;

    /**
     * Date representation od the config value, used by the datetimepicker
     */
    public dateValue: Date;

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

    public rawDate: Date;

    /**
     * The config item for this component. Just accept components with already populated constants-info.
     */
    @Input()
    public set item(value: ViewConfig) {
        if (value && value.hasConstantsInfo) {
            this.configItem = value;

            if (this.form) {
                this.form.patchValue(
                    {
                        value: this.configItem.value
                    },
                    { emitEvent: false }
                );
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
     * @param cdRef ChangeDetectorRef
     * @param repo ConfigRepositoryService
     * @param dateTimeAdapter DateTimeAdapter
     */
    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private formBuilder: FormBuilder,
        private cdRef: ChangeDetectorRef,
        public repo: ConfigRepositoryService,
        dateTimeAdapter: DateTimeAdapter<any>
    ) {
        super(titleService, translate);
        dateTimeAdapter.setLocale(this.translate.currentLang);
    }

    /**
     * Sets up the form for this config field.
     */
    public ngOnInit(): void {
        this.form = this.formBuilder.group({
            value: ['']
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
        if (this.configItem.inputType === 'datetimepicker') {
            this.dateValue = new Date(this.configItem.value as number);
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
     * Trigger an update of the data
     */
    private onChange(value: any): void {
        if (this.configItem.inputType === 'datetimepicker') {
            this.dateValue = new Date(value as number);
        }
        if (this.debounceTimeout !== null) {
            clearTimeout(<any>this.debounceTimeout);
        }
        this.debounceTimeout = <any>setTimeout(() => {
            this.update(value);
        }, this.configItem.getDebouncingTimeout());
        this.cdRef.detectChanges();
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
            this.cdRef.detectChanges();
        }, 2000);
        this.updateSuccessIcon = true;
        this.cdRef.detectChanges();
    }

    /**
     * Sets the error on this field.
     */
    private setError(error: string): void {
        this.error = error;
        this.form.setErrors({ error: true });
        this.cdRef.detectChanges();
    }

    /**
     * Uses the configItem to determine the kind of interation:
     * input, textarea, choice or date
     *
     * @param type: the type of a config item
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
     * @returns wheather it should be excluded or not
     */
    public isExcludedType(type: string): boolean {
        const excluded = ['boolean', 'markupText', 'text', 'translations', 'datetimepicker'];
        return excluded.includes(type);
    }

    /**
     * custom handler for datetime picker updates. Sets the form's value
     * to the timestamp of the Date being the event's value
     *
     * @param event an event-like object with a Date as value property
     */
    public updateTime(event: { value: Date }): void {
        this.dateValue = event.value;
        this.onChange(event.value.valueOf());
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
}
