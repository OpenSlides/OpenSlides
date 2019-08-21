import { Directive, ElementRef, Input, OnInit } from '@angular/core';

import { ResizeSensor } from 'css-element-queries';
import { Subject } from 'rxjs';

/**
 * Directive to check, if the `ScrollHeight` of the underlying element has changed.
 */
@Directive({
    selector: '[osHeightResizing]'
})
export class HeightResizingDirective implements OnInit {
    /**
     * A subject to notify, when the given element changes its `ScrollHeight`.
     */
    @Input()
    public osHeightResizing: Subject<number>;

    /**
     * The underlying native-element of the passed element.
     */
    private nativeElement: HTMLElement;

    /**
     * Stores the old height to see, if the height changed.
     */
    private oldHeight: number;

    /**
     * Constructor.
     * Initializes the `nativeElement`.
     *
     * @param element The passed element for this directive.
     */
    public constructor(element: ElementRef) {
        if (element) {
            this.nativeElement = <HTMLElement>element.nativeElement;
        }
    }

    /**
     * Initializes the listener for resizing events of the passed element.
     */
    public ngOnInit(): void {
        // tslint:disable-next-line:no-unused-expression
        new ResizeSensor(this.nativeElement, () => {
            this.checkElementForChanges();
        });
        this.checkElementForChanges();
    }

    /**
     * Function to check, if the height of the passed element changed
     * and if the new height is different to the old one.
     *
     * If the new height is different to the old one, the subject gets a new value.
     */
    private checkElementForChanges(): void {
        if (this.nativeElement.scrollHeight === this.oldHeight) {
            return;
        }

        this.oldHeight = this.nativeElement.scrollHeight;

        if (this.osHeightResizing) {
            this.osHeightResizing.next(this.nativeElement.scrollHeight);
        }
    }
}
