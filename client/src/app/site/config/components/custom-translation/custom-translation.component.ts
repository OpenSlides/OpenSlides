import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { CustomTranslation, CustomTranslations } from 'app/core/translate/translation-parser';

/**
 * Custom translations as custom form component
 *
 * @example:
 * ```html
 * <os-custom-translation formControlName="value"></os-custom-translation>
 * ```
 */
@Component({
    selector: 'os-custom-translation',
    templateUrl: './custom-translation.component.html',
    styleUrls: ['./custom-translation.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CustomTranslationComponent),
            multi: true
        }
    ]
})
export class CustomTranslationComponent implements ControlValueAccessor {
    /**
     * Holds the custom translations in a list
     */
    public translations: CustomTranslations = [];

    /**
     * Empty constructor
     */
    public constructor() {}

    /**
     * Helper function to determine which information to give to the parent form
     */
    private propagateChange = (_: any) => {};

    /**
     * The value from the FormControl
     *
     * @param obj the value from the parent form. Type "any" is required by the interface
     */
    public writeValue(obj: any): void {
        if (obj) {
            this.translations = obj;
        }
    }

    /**
     * Hands changes back to the parent form
     *
     * @param fn the function to propagate the changes
     */
    public registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    /**
     * To satisfy the interface.
     *
     * @param fn
     */
    public registerOnTouched(fn: any): void {}

    /**
     * To satisfy the interface
     *
     * @param isDisabled
     */
    public setDisabledState?(isDisabled: boolean): void {}

    /**
     * Detects changes to the "original" word
     *
     * @param value the value that was typed
     * @param index the index of the change
     */
    public onChangeOriginal(value: string, index: number): void {
        this.translations[index].original = value;
        this.propagateChange(this.translations);
    }

    /**
     * Detects changes to the translation
     * @param value the value that was typed
     * @param index the index of the change
     */
    public onChangeTranslation(value: string, index: number): void {
        this.translations[index].translation = value;
        this.propagateChange(this.translations);
    }

    /**
     * Removes a custom translation
     * @param index the translation to remove
     */
    public onRemoveTranslation(index: number): void {
        this.translations.splice(index, 1);
        this.propagateChange(this.translations);
    }

    /**
     * Adds a new custom translation to the list and to the server
     */
    public onAddNewTranslation(): void {
        const newCustomTranslation: CustomTranslation = {
            original: 'New',
            translation: 'New'
        };

        this.translations.push(newCustomTranslation);
        this.propagateChange(this.translations);
    }
}
