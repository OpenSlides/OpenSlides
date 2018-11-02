import { Component, OnInit, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ViewConfig } from '../../models/view-config';
import { BaseComponent } from '../../../../base.component';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ConfigRepositoryService } from '../../services/config-repository.service';
import { ParentErrorStateMatcher } from '../../../../shared/parent-error-state-matcher';

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
     * The config item for this component. Just accept components with already populated constants-info.
     */
    @Input()
    public set item(value: ViewConfig) {
        if (value.hasConstantsInfo) {
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
     * The usual component constructor
     * @param titleService
     * @param translate
     */
    public constructor(
        protected titleService: Title,
        protected translate: TranslateService,
        private formBuilder: FormBuilder,
        private cdRef: ChangeDetectorRef,
        public repo: ConfigRepositoryService
    ) {
        super(titleService, translate);
    }

    /**
     * Sets up the form for this config field.
     */
    public ngOnInit(): void {
        this.form = this.formBuilder.group({
            value: ['']
        });
        this.form.patchValue({
            value: this.configItem.value
        });
        this.form.valueChanges.subscribe(form => {
            this.onChange(form.value);
        });
    }

    /**
     * Trigger an update of the data
     */
    private onChange(value: any): void {
        if (this.debounceTimeout !== null) {
            clearTimeout(<any>this.debounceTimeout);
        }
        this.debounceTimeout = <any>setTimeout(() => {
            this.update(value);
        }, this.configItem.getDebouncingTimeout());
        this.cdRef.detectChanges();
    }

    /**
     * Updates the this config field.
     * @param value The new value to set.
     */
    private update(value: any): void {
        // TODO: Fix the Datetimepicker parser and formatter.
        if (this.configItem.inputType === 'datetimepicker') {
            value = Date.parse(value);
        }
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
}
