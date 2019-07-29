import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';

import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
    selector: 'os-rounded-input',
    templateUrl: './rounded-input.component.html',
    styleUrls: ['./rounded-input.component.scss']
})
export class RoundedInputComponent implements OnInit, OnDestroy {
    /**
     * Reference to the `<input />`-element.
     */
    @ViewChild('osInput', { static: true })
    public osInput: ElementRef;

    /**
     * Setter for the model. This could be useful, if the value of the input
     * should be set from outside of this component.
     *
     * @param value The new value of the input.
     */
    @Input()
    public set model(value: string) {
        if (!!value) {
            this.modelForm.setValue(value);
        }
    }

    /**
     * Getter for the model.
     *
     * @returns {string} The value of the FormControl. If this is undefined or null, it returns an empty string.
     */
    public get model(): string {
        return this.modelForm ? this.modelForm.value : '';
    }

    /**
     * Controls the size of the input.
     *
     * Possible values are `'small' | 'medium' | 'large'`.
     * Defaults to `'medium'`.
     */
    @Input()
    public size: 'small' | 'medium' | 'large' = 'medium';

    /**
     * Custom `FormControl`.
     */
    @Input()
    public modelForm: FormControl;

    /**
     * Boolean, whether the input should be focussed automatically, if the component enters the DOM.
     */
    @Input()
    public autofocus = false;

    /**
     * Boolean, whether the input should fire the value-change-event after a specific time.
     */
    @Input()
    public lazyInput = false;

    /**
     * Placeholder for the input. Defaults to `Search...`.
     */
    @Input()
    public placeholder = 'Search...';

    /**
     * Boolean, whether the input will be cleared, if the user presses `Escape`.
     */
    @Input()
    public clearOnEscape = true;

    /**
     * EventHandler for the input-changes.
     */
    @Output()
    public oninput: EventEmitter<string> = new EventEmitter();

    /**
     * EventHandler for the key-events.
     */
    @Output()
    public onkeyup: EventEmitter<KeyboardEvent> = new EventEmitter();

    /**
     * Subscription, that will handle the value-changes of the input.
     */
    private subscription: Subscription;

    /**
     * Default constructor
     */
    public constructor() {
        if (!this.modelForm) {
            this.modelForm = new FormControl(this.model);
        }
    }

    /**
     * Overwrites `OnInit` - initializes the subscription.
     */
    public ngOnInit(): void {
        this.subscription = this.modelForm.valueChanges
            .pipe(debounceTime(this.lazyInput ? 250 : 0))
            .subscribe(nextValue => {
                this.oninput.emit(nextValue);
            });
    }

    /**
     * Overwrites `OnDestroy` - clears the subscription.
     */
    public ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }

    /**
     * Function to clear the input and refocus it.
     */
    public clear(): void {
        this.osInput.nativeElement.focus();
        this.modelForm.setValue('');
    }

    /**
     * Function to handle typing.
     * Useful to listen to special keys.
     *
     * @param event The `KeyboardEvent`.
     */
    public keyPressed(event: KeyboardEvent): void {
        if (this.clearOnEscape && event.key === 'Escape') {
            this.clear();
        }
        this.onkeyup.emit(event);
    }
}
