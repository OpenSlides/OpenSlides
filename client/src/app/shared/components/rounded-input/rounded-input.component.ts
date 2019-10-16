import {
    Component,
    ElementRef,
    EventEmitter,
    HostBinding,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';

import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/**
 * Type declared to see, which values are possible for some inputs.
 */
export type Size = 'small' | 'medium' | 'large';

@Component({
    selector: 'os-rounded-input',
    templateUrl: './rounded-input.component.html',
    styleUrls: ['./rounded-input.component.scss']
})
export class RoundedInputComponent implements OnInit, OnDestroy {
    /**
     * Binds the class to the parent-element.
     */
    @HostBinding('class')
    public get classes(): string {
        return this.fullWidth ? 'full-width' : '';
    }

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
        if (value) {
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
    public size: Size = 'medium';

    /**
     * Whether this component should render over the full width.
     */
    @Input()
    public fullWidth = false;

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
     * Boolean, whether the input should keep the focus, even if it loses the focus.
     */
    @Input()
    public keepFocus = false;

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
     * Boolean to indicate, whether the input should have rounded borders at the bottom or not.
     */
    @Input()
    public hasChildren = false;

    /**
     * Boolean to indicate, whether the borders should be rounded with a smaller size.
     */
    @Input()
    public set typeBorderRadius(radius: Size) {
        this._borderRadius = radius + '-border-radius';
    }

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
     * Getter to get the border-radius as a string.
     *
     * @returns {string} The border-radius as class.
     */
    public get borderRadius(): string {
        return this._borderRadius;
    }
    /**
     * Subscription, that will handle the value-changes of the input.
     */
    private subscription: Subscription;

    /**
     * Variable for the border-radius as class.
     */
    private _borderRadius = 'large-border-radius';

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
        if (this.autofocus) {
            this.focus();
        }
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
        this.focus();
        this.modelForm.setValue('');
    }

    /**
     * Function to programmatically focus the input.
     */
    public focus(): void {
        this.osInput.nativeElement.focus();
    }

    /**
     * Function called, if the input loses its focus.
     */
    public blur(): void {
        if (this.keepFocus) {
            this.focus();
        }
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
