import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';

import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
    selector: 'os-extension-field',
    templateUrl: './extension-field.component.html',
    styleUrls: ['./extension-field.component.scss']
})
export class ExtensionFieldComponent implements OnInit, OnDestroy {
    /**
     * Optional additional classes for the `mat-chip`.
     */
    @Input()
    public classes: string | string[] | object = 'bluegrey';

    /**
     * Title for this component.
     */
    @Input()
    public title: string;

    /**
     * Value of the chip.
     */
    @Input()
    public chipValue: string;

    /**
     * Boolean, whether the extension should be shown.
     */
    @Input()
    public hasExtension = false;

    /**
     * Optional label for the input.
     */
    @Input()
    public extensionLabel: string;

    /**
     * Optional label for the search-list.
     */
    @Input()
    public searchListLabel: string;

    /**
     * BehaviourSubject for the search-list.
     */
    @Input()
    public searchList: BehaviorSubject<object[]>;

    /**
     * Boolean, whether the input and the search-list can be changed.
     */
    @Input()
    public canBeEdited = true;

    /**
     * Boolean, whether the list should fire events, if it changes.
     */
    @Input()
    public listSubmitOnChange = false;

    /**
     * Boolean, whether to append the value from list to the input.
     */
    @Input()
    public appendValueToInput = true;

    /**
     * Prefix, if the value from list should be appended to the input.
     */
    @Input()
    public listValuePrefix = '';

    /**
     * Suffix, if the value from list should be appended to the input.
     */
    @Input()
    public listValueSuffix = '';

    /**
     * Initial value of the input-field.
     */
    @Input()
    public inputValue: string;

    /**
     * EventEmitter, when clicking on the 'save'-button.
     */
    @Output()
    public success: EventEmitter<string | object> = new EventEmitter();

    /**
     * EventEmitter, if the list has changed.
     */
    @Output()
    public listChange: EventEmitter<number> = new EventEmitter();

    /**
     * Model for the input-field.
     */
    public inputControl = '';

    /**
     * FormGroup for the search-list.
     */
    public extensionFieldForm: FormGroup;

    /**
     * Boolean to decide, whether to open the extension-input and search-list.
     */
    public editMode = false;

    /**
     * Hold the nav subscription
     */
    private navigationSubscription: Subscription;

    /**
     * Subscription for the search value selector
     */
    private searchValueSubscription: Subscription;

    /**
     * Constructor
     *
     * @param fb The FormBuilder
     */
    public constructor(private fb: FormBuilder, private router: Router) {}

    /**
     * OnInit-method.
     */
    public ngOnInit(): void {
        this.navigationSubscription = this.router.events.subscribe(navEvent => {
            if (navEvent instanceof NavigationEnd) {
                this.editMode = false;

                if (this.extensionFieldForm) {
                    this.extensionFieldForm.reset();
                }
            }
        });

        this.initInput();

        if (this.searchList) {
            this.extensionFieldForm = this.fb.group({
                list: [[]]
            });

            this.searchValueSubscription = this.extensionFieldForm.get('list').valueChanges.subscribe((value: any) => {
                if (value && typeof value === 'number') {
                    if (this.listSubmitOnChange) {
                        this.listChange.emit(value);
                    }
                    if (this.appendValueToInput) {
                        if (!this.inputControl) {
                            this.inputControl = '';
                        }
                        this.inputControl += `[${this.listValuePrefix}${value}${this.listValueSuffix}]`;
                    }
                    this.extensionFieldForm.reset();
                }
            });
        }
    }

    /**
     * On destroy unsubscribe from the subscriptions
     */
    public ngOnDestroy(): void {
        this.navigationSubscription.unsubscribe();
        if (this.searchValueSubscription) {
            this.searchValueSubscription.unsubscribe();
        }
    }

    /**
     * Hitting enter on the input field should save the content
     */
    public keyDownFunction(event: any): void {
        if (event.key === 'Enter') {
            this.changeEditMode(true);
        }
    }

    /**
     * Function to switch to or from editing-mode.
     *
     * @param save Boolean, whether the changes should be saved or resetted.
     */
    public changeEditMode(save: boolean = false): void {
        if (save) {
            this.sendSuccess();
        } else {
            this.initInput();
        }
        this.editMode = !this.editMode;
    }

    /**
     * Initialize the value of the input.
     */
    public initInput(): void {
        this.inputControl = this.inputValue;
    }

    /**
     * Function to execute, when the values are saved.
     */
    public sendSuccess(): void {
        if (this.success) {
            const submitMessage =
                this.listSubmitOnChange || this.appendValueToInput || !this.searchList
                    ? this.inputControl
                    : { extensionInput: this.inputControl, extensionList: this.extensionFieldForm.get('list').value };
            this.success.emit(submitMessage);
        }
    }
}
