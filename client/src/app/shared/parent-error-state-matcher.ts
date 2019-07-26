import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

/**
 * Custom state matcher for mat-errors. Enables the error for an input, if one has set the error
 * with `setError` on the parent element.
 */
export class ParentErrorStateMatcher implements ErrorStateMatcher {
    public isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = !!(form && form.submitted);
        const controlTouched = !!(control && (control.dirty || control.touched));
        const controlInvalid = !!(control && control.invalid);
        const parentInvalid = !!(
            control &&
            control.parent &&
            control.parent.invalid &&
            (control.parent.dirty || control.parent.touched)
        );

        return (isSubmitted || controlTouched) && (controlInvalid || parentInvalid);
    }
}
