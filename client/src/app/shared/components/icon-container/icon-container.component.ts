import { Component, Input, HostBinding } from '@angular/core';

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
        switch (this.size) {
            case 'medium':
                return 'medium-container';
            case 'large':
                return 'large-container';
        }
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
    public size: 'medium' | 'large' = 'medium';

    /**
     * Reverse text and icon.
     * Show the icon behind the text
     */
    @Input()
    public swap = false;
}
