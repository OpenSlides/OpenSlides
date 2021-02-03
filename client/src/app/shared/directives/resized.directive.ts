import { Directive, ElementRef, Input, OnInit } from '@angular/core';

import { ResizeSensor } from 'css-element-queries';
import { Subject } from 'rxjs';

export interface ElementSize {
    width: number;
    height: number;
}
/**
 * This directive takes a Subject<ElementSize> as input and everytime the surrounding element
 * was resized, the subject is fired.
 *
 * Usage:
 * `<div [osRezised]="mySubject">...content...</div>`
 */
@Directive({
    selector: '[osResized]'
})
export class ResizedDirective implements OnInit {
    @Input()
    public osResized: Subject<ElementSize>;

    /**
     * Old width, to check, if the width has actually changed.
     */
    private oldWidth: number;

    /**
     * Old height, to check, if the height has actually changed.
     */
    private oldHeight: number;

    public constructor(private element: ElementRef) {}

    /**
     * Inits the ResizeSensor. triggers initial size change.
     */
    public ngOnInit(): void {
        // tslint:disable-next-line:no-unused-expression
        new ResizeSensor(this.element.nativeElement, x => this.onSizeChanged());
        this.onSizeChanged();
    }

    /**
     * The size has changed. Check, if the size actually hs changed. If so,
     * trigger the given subject.
     */
    private onSizeChanged(): void {
        const newWidth = this.element.nativeElement.clientWidth;
        const newHeight = this.element.nativeElement.clientHeight;

        if (newWidth === this.oldWidth && newHeight === this.oldHeight) {
            return;
        }

        this.oldWidth = newWidth;
        this.oldHeight = newHeight;

        if (this.osResized) {
            this.osResized.next({
                width: newWidth,
                height: newHeight
            });
        }
    }
}
