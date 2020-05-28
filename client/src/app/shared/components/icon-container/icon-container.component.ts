import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
    selector: 'os-icon-container',
    templateUrl: './icon-container.component.html',
    styleUrls: ['./icon-container.component.scss']
})
export class IconContainerComponent {
    /**
     * HostBinding to add the necessary class related to the size.
     */
    @HostBinding('class')
    public get classes(): string {
        return `${this.size}-container`;
    }

    /**
     * Input for the used icon.
     */
    @Input()
    public icon: string;

    /**
     * Optional size property. Can be large, if needed.
     */
    @Input()
    public size: 'small' | 'medium' | 'large' | 'gigantic' = 'medium';

    /**
     * Reverse text and icon.
     * Show the icon behind the text
     */
    @Input()
    public swap = false;

    /**
     * Boolean to decide, when to show the icon.
     */
    @Input()
    public showIcon = true;

    /**
     * Optional string as tooltip for icon.
     */
    @Input()
    public iconTooltip: string;

    /**
     * Uses a css class for nowrap
     */
    @Input()
    public noWrap = false;

    /**
     * Optional action for clicking on the icon.
     */
    @Output()
    public iconAction: EventEmitter<any> = new EventEmitter();

    /**
     * Function executed, when the icon is clicked.
     */
    public iconClick(): void {
        this.iconAction.emit();
    }
}
