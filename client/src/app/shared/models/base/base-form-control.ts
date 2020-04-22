import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ElementRef, HostBinding, Input, OnDestroy, Optional, Self } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormControl, FormGroup, NgControl } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';

import { Subject, Subscription } from 'rxjs';

/**
 * Abstract class to implement some simple logic and provide the subclass as a controllable
 * form-control in `MatFormField`.
 *
 * Please remember to prepare the `providers` in the `@Component`-decorator. Something like:
 *
 * ```ts
 * @Component({
 *   selector: ...,
 *   templateUrl: ...,
 *   styleUrls: [...],
 *   providers: [{ provide: MatFormFieldControl, useExisting: <TheComponent>}]
 * })
 * ```
 */
export abstract class BaseFormControlComponent<T> extends MatFormFieldControl<T>
    implements OnDestroy, ControlValueAccessor {
    public static nextId = 0;

    @HostBinding() public id = `base-form-control-${BaseFormControlComponent.nextId++}`;

    @HostBinding('class.floating') public get shouldLabelFloat(): boolean {
        return this.focused || !this.empty;
    }

    @HostBinding('attr.aria-describedby') public describedBy = '';

    @Input()
    public set value(value: T | null) {
        this.updateForm(value);
        this.stateChanges.next();
    }

    public get value(): T | null {
        return this.contentForm.value || null;
    }

    @Input()
    public set placeholder(placeholder: string) {
        this._placeholder = placeholder;
        this.stateChanges.next();
    }

    public get placeholder(): string {
        return this._placeholder;
    }

    @Input()
    public set required(required: boolean) {
        this._required = coerceBooleanProperty(required);
        this.stateChanges.next();
    }

    public get required(): boolean {
        return this._required;
    }

    @Input()
    public set disabled(disable: boolean) {
        this._disabled = coerceBooleanProperty(disable);
        this._disabled ? this.contentForm.disable() : this.contentForm.enable();
        this.stateChanges.next();
    }

    public get disabled(): boolean {
        return this._disabled;
    }

    public abstract get empty(): boolean;

    public abstract get controlType(): string;

    public contentForm: FormControl | FormGroup;

    public stateChanges = new Subject<void>();

    public errorState = false;

    public focused = false;

    private _placeholder: string;

    private _required = false;

    private _disabled = false;

    protected subscriptions: Subscription[] = [];

    public constructor(
        protected fb: FormBuilder,
        protected fm: FocusMonitor,
        protected element: ElementRef<HTMLElement>,
        @Optional() @Self() public ngControl: NgControl
    ) {
        super();

        this.initializeForm();

        if (this.ngControl !== null) {
            this.ngControl.valueAccessor = this;
        }

        this.subscriptions.push(
            fm.monitor(element.nativeElement, true).subscribe(origin => {
                this.focused = origin === 'mouse' || origin === 'touch';
                this.stateChanges.next();
            }),
            this.contentForm.valueChanges.subscribe(nextValue => this.push(nextValue))
        );
    }

    public ngOnDestroy(): void {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
        this.subscriptions = [];

        this.fm.stopMonitoring(this.element.nativeElement);

        this.stateChanges.complete();
    }

    public writeValue(value: T): void {
        this.value = value;
    }
    public registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    public registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    public setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    public setDescribedByIds(ids: string[]): void {
        this.describedBy = ids.join(' ');
    }

    public abstract onContainerClick(event: MouseEvent): void;

    protected _onChange = (value: T) => {};

    protected _onTouched = (value: T) => {};

    protected abstract initializeForm(): void;

    protected abstract updateForm(value: T | null): void;

    protected push(value: T): void {
        this._onChange(value);
        this._onTouched(value);
    }
}
