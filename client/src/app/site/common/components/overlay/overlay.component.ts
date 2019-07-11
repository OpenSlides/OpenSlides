import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'os-overlay',
    templateUrl: './overlay.component.html',
    styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent implements OnInit {
    /**
     * Optional set the position of the component overlying on this overlay.
     *
     * Defaults to `'center'`.
     */
    @Input()
    public position: 'center' | 'left' | 'top' | 'right' | 'bottom' = 'center';

    /**
     * EventEmitter to handle a click on the backdrop.
     */
    @Output()
    public backdrop = new EventEmitter<void>();

    /**
     * EventEmitter to handle clicking `escape`.
     */
    @Output()
    public escape = new EventEmitter<void>();

    /**
     * Default constructor
     */
    public constructor() {}

    /**
     * OnInit
     */
    public ngOnInit(): void {}

    /**
     * Listens to keyboard inputs.
     *
     * If the user presses `escape`, the EventEmitter will emit a signal.
     *
     * @param event `KeyboardEvent`.
     */
    @HostListener('document:keydown', ['$event'])
    public keyListener(event: KeyboardEvent): void {
        if (event.code === 'Escape') {
            this.escape.emit();
        }
    }
}
