import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewEncapsulation
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';

import { BaseComponent } from 'app/base.component';
import { ConfigRepositoryService } from 'app/core/repositories/config/config-repository.service';
import { GroupRepositoryService } from 'app/core/repositories/users/group-repository.service';
import { ParentErrorStateMatcher } from 'app/shared/parent-error-state-matcher';
import { ViewGroup } from 'app/site/users/models/view-group';
import { ConfigItem } from '../config-list/config-list.component';
import { ViewConfig } from '../../models/view-config';

/**
 * Component for a config field, used by the {@link ConfigListComponent}. Handles
 * all input types defined by the server, as well as updating the configs
 *
 * @example
 * ```ts
 * <os-config-field [config]="<ViewConfig>"></os-config-field>
 * ```
 */
@Component({
    selector: 'os-config-field',
    templateUrl: './config-field.component.html',
    styleUrls: ['./config-field.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None // to style the date and time pickers
})
export class ConfigFieldComponent extends BaseComponent implements OnInit, OnDestroy {
    public configItem: ViewConfig;

    /**
     * Option to show a green check-icon.
     */
    public updateSuccessIcon = false;

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
    public set config(value: ViewConfig) {
        if (value) {
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
     * Passes the list of errors as object.
     *
     * The function looks, if the key of this config-item is contained in the list.
     *
     * @param errorList The object containing all errors.
     */
    @Input()
    public set errorList(errorList: { [key: string]: any }) {
        const hasError = Object.keys(errorList).find(errorKey => errorKey === this.configItem.key);
        if (hasError) {
            this.error = errorList[hasError];
            this.updateError(true);
        } else {
            this.error = null;
            this.updateError(null);
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

    @Output()
    public update = new EventEmitter<ConfigItem>();

    /** used by the groups config type */
    public groupObservable: Observable<ViewGroup[]> = null;

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
        public repo: ConfigRepositoryService,
        private groupRepo: GroupRepositoryService
    ) {
        super(titleService, translate);
    }

    /**
     * Sets up the form for this config field.
     */
    public ngOnInit(): void {
        // filter out empty results in group observable. We never have no groups and it messes up
        // the settings change detection
        this.groupObservable = this.groupRepo
            .getViewModelListObservableWithoutDefaultGroup()
            .pipe(filter(groups => !!groups.length));

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
     * Stops the change detection
     */
    public ngOnDestroy(): void {
        this.cd.detach();
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
        return { date, time };
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
        if (this.configItem.inputType === 'groups') {
            // we have to check here explicitly if nothing changed because of the search value selector
            const newS = new Set(value);
            const oldS = new Set(this.configItem.value);
            if (newS.equals(oldS)) {
                return;
            }
        }
        this.sendUpdate(value);
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
    private sendUpdate(value: any): void {
        this.update.emit({ key: this.configItem.key, value });
    }

    /**
     * Function to update the form-control to display or hide an error.
     *
     * @param error `true | false`, if an error should be shown. `null`, if there is no error.
     */
    private updateError(error: boolean | null): void {
        if (this.form) {
            this.form.setErrors(error ? { error } : null);
            this.cd.detectChanges();
        }
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
                        this.sendUpdate(ev.target.getContent());
                    }
                });
            }
        };
    }
}
