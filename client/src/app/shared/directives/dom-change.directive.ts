import { Directive, ElementRef, EventEmitter, OnDestroy, Output } from '@angular/core';

/**
 * detects changes in DOM and emits a signal on changes.
 *
 * @example (appDomChange)="onChange($event)"
 */
@Directive({
    selector: '[osDomChange]'
})
export class DomChangeDirective implements OnDestroy {
    private changes: MutationObserver;

    @Output() public domChange = new EventEmitter();

    public constructor(private elementRef: ElementRef) {
        const element = this.elementRef.nativeElement;

        this.changes = new MutationObserver((mutations: MutationRecord[]) => {
            mutations.forEach((mutation: MutationRecord) => this.domChange.emit(mutation));
        });

        this.changes.observe(element, {
            attributes: true,
            childList: true,
            characterData: true
        });
    }

    public ngOnDestroy(): void {
        this.changes.disconnect();
    }
}
