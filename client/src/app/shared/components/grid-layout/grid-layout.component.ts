import { Component, Input } from '@angular/core';

/**
 * Component to create a `grid-layout`.
 * Aligns items in a flex display.
 */
@Component({
    selector: 'os-grid-layout',
    templateUrl: './grid-layout.component.html',
    styleUrls: ['./grid-layout.component.scss']
})
export class GridLayoutComponent {
    /**
     * Property for an optional title.
     */
    @Input()
    public title: string;

    /**
     * If the grid layout should have no space.
     * This contains the padding for the grid itself and the margin of the tiles.
     */
    @Input()
    public noSpace: boolean;
}
