import { Component, ContentChild, Input, TemplateRef } from '@angular/core';

import { TileComponent } from '../tile/tile.component';

/**
 * Enumeration to define if the content is only text or a node.
 */
export enum ContentType {
    text = 'text',
    node = 'node'
}

/**
 * Enumeration to define of which the big block is.
 */
export enum BlockType {
    text = 'text',
    node = 'node',
    picture = 'picture'
}

/**
 * Tells, whether to align the block and content next to each other or one below the other.
 */
export enum Orientation {
    horizontal = 'horizontal',
    vertical = 'vertical'
}

/**
 * Tells, if the tile should only display the content or the title in the content part.
 */
export enum ShowOnly {
    title = 'title',
    content = 'content'
}

/**
 * Class, that extends the `tile.component`.
 * This class specifies a tile with two separated parts: the block and the content part.
 * The block part is like a header, the content part contains further information.
 */
@Component({
    selector: 'os-block-tile',
    templateUrl: './block-tile.component.html',
    styleUrls: ['./block-tile.component.scss']
})
export class BlockTileComponent extends TileComponent {
    /**
     * Reference to the content of the content part.
     */
    @ContentChild(TemplateRef, { static: true })
    public contentNode: TemplateRef<any>;

    /**
     * Reference to the block part, if it is a node.
     */
    @ContentChild(TemplateRef, { static: true })
    public blockNode: TemplateRef<any>;

    /**
     * Reference to the action buttons in the content part, if used.
     */
    @ContentChild(TemplateRef, { static: true })
    public actionNode: TemplateRef<any>;

    /**
     * Defines the type of the primary block.
     */
    @Input()
    public blockType: BlockType;

    /**
     * Input for the primary block content.
     * Only string for the source of a picture or text.
     */
    @Input()
    public block: string;

    /**
     * Defines the type of the content.
     */
    @Input()
    public contentType: ContentType;

    /**
     * The title in the content part.
     */
    @Input()
    public title: string;

    /**
     * The subtitle in the content part.
     */
    @Input()
    public subtitle: string;

    /**
     * Tells the orientation -
     * whether the block part should be displayed above the content or next to it.
     */
    @Input()
    public orientation: Orientation;

    /**
     * Tells, whether the tile should display only one of `Title` or `Content` in the content part.
     */
    @Input()
    public only: ShowOnly;

    /**
     * Boolean, whether to show action buttons in the content part.
     */
    @Input()
    public showActions: boolean;
}
