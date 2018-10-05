import { Directive, ElementRef, OnInit } from '@angular/core';

/**
 * enhanced version of `autofocus` for (but not exclusively) html input fields.
 * Works even if the input field was added dynamically using `*ngIf`
 *
 * @example
 * ```html
 * <input matInput osAutofocus required>
 * ```
 */
@Directive({
    selector: '[osAutofocus]'
})
export class AutofocusDirective implements OnInit {
    /**
     * Constructor
     *
     * Gets the reference of the annotated element
     * @param el ElementRef
     */
    public constructor(private el: ElementRef) {}

    /**
     * Executed after page init, calls the focus function after an unnoticeable timeout
     */
    public ngOnInit(): void {
        // Otherwise Angular throws error: Expression has changed after it was checked.
        setTimeout(() => {
            this.el.nativeElement.focus();
        });
    }
}
