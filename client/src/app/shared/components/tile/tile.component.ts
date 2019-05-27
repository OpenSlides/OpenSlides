import { Component, ContentChild, EventEmitter, HostBinding, Input, OnInit, Output, TemplateRef } from '@angular/core';

/**
 * Interface, that defines the type of the `ClickEvent`.
 */
export interface EventObject {
    data: Object;
    source: MouseEvent;
}

/**
 * Interface, that defines the possible shape of `@Input() preferredSize`
 */
export interface SizeObject {
    mobile?: number;
    tablet?: number;
    medium?: number;
    large?: number;
}

/**
 * Component, that acts like a tile in a grid-layout.
 * This component accepts several attributes, that define the size of it.
 */
@Component({
    selector: 'os-tile',
    templateUrl: './tile.component.html',
    styleUrls: ['./tile.component.scss']
})
export class TileComponent implements OnInit {
    /**
     * HostBinding to add the necessary classes to the host element `os-tile`.
     */
    @HostBinding('class')
    public get classes(): string {
        return (
            'os-tile' +
            ' os-tile--xs-' +
            this.mobileSize +
            ' os-tile--sm-' +
            this.tabletSize +
            ' os-tile--md-' +
            this.mediumSize +
            ' os-tile--lg-' +
            this.largeSize
        );
    }

    /**
     * Reference to the dynamic content.
     */
    @ContentChild(TemplateRef, { static: true })
    public tileContext: TemplateRef<any>;

    /**
     * Optional data, that can be passed to the component.
     */
    @Input()
    public data: Object;

    /**
     * Optional input to define the preferred size of the tile.
     * This can be a number, which defines the size in every device resolution,
     * or an object, which defines the size for each one resolution separately.
     */
    @Input()
    public preferredSize: number | SizeObject;

    /**
     * EventEmitter for the `ClickEvent`.
     */
    @Output()
    public clicked: EventEmitter<EventObject> = new EventEmitter<EventObject>();

    /**
     * Property, which defines the size of the tile @Mobile
     */
    public mobileSize: number;

    /**
     * Property, which defines the size of the tile @Tablet
     */
    public tabletSize: number;

    /**
     * Property, which defines the size of the tile @Medium devices
     */
    public mediumSize: number;

    /**
     * Property, which defines the size of the tile @Large devices
     */
    public largeSize: number;

    /**
     * OnInit method.
     * The preferred size for the tile will calculated.
     */
    public ngOnInit(): void {
        if (!this.preferredSize) {
            this.preferredSize = 4;
        }
        if (typeof this.preferredSize === 'number') {
            this.setLargeSize(this.preferredSize);
            this.setMediumSize(this.preferredSize);
            this.setTabletSize(this.preferredSize);
            this.setMobileSize(this.preferredSize);
        } else {
            const {
                mobile,
                tablet,
                medium,
                large
            }: { mobile?: number; tablet?: number; medium?: number; large?: number } = this.preferredSize;
            this.setMobileSize(mobile);
            this.setTabletSize(tablet);
            this.setMediumSize(medium);
            this.setLargeSize(large);
        }
    }

    /**
     * Function, that fires when the user clicks on the tile.
     *
     * @param event The source event on click.
     */
    public onClick(event: MouseEvent): void {
        this.clicked.emit({
            data: this.data,
            source: event
        });
    }

    /**
     * Function to set the size @Mobile
     *
     * @param size how great the tile should be
     */
    private setMobileSize(size: number): void {
        if (size <= 4 && size >= 0) {
            this.mobileSize = size;
        } else {
            this.mobileSize = 4;
        }
    }

    /**
     * Function to set the size @Tablet
     *
     * @param size how great the tile should be
     */
    private setTabletSize(size: number = 4): void {
        if (size <= 8 && size >= 0) {
            this.tabletSize = size;
        } else {
            this.tabletSize = 8;
        }
    }

    /**
     * Function to set the size of the tile @Medium devices
     *
     * @param size how great the tile should be
     */
    private setMediumSize(size: number = 4): void {
        if (size <= 12 && size >= 0) {
            this.mediumSize = size;
        } else {
            this.mediumSize = 12;
        }
    }

    /**
     * Function to set the size of the tile @Large devices
     *
     * @param size how great the tile should be
     */
    private setLargeSize(size: number = 4): void {
        if (size <= 16 && size >= 0) {
            this.largeSize = size;
        } else {
            this.largeSize = 16;
        }
    }
}
