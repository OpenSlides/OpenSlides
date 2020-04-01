import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';

import { TileComponent } from '../tile/tile.component';

/**
 * Enumeration to define of which the big block is.
 */
export enum BlockType {
    text = 'text',
    node = 'node'
}

/**
 * Tells, whether to align the block and content next to each other or one below the other.
 */
export type Orientation = 'horizontal' | 'vertical';

/**
 * Tells, if the tile should only display the content or the title in the content part.
 */
export type ShowOnly = 'title' | 'content' | null;

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
export class BlockTileComponent extends TileComponent implements AfterViewInit {
    /**
     * Reference to the content of the content part.
     */
    @ViewChild('contentNode')
    public contentNode: ElementRef<HTMLElement>;

    /**
     * Reference to the block part, if it is a node.
     */
    @ViewChild('blockNode')
    public blockNode: ElementRef<HTMLElement>;

    /**
     * Reference to the action buttons in the content part, if used.
     */
    @ViewChild('actionNode')
    public actionNode: ElementRef<HTMLElement>;

    /**
     * Defines the type of the primary block.
     */
    @Input()
    public blockType: BlockType = BlockType.node;

    /**
     * Manually remove the padding, the block is surrounded by.
     */
    @Input()
    public noPaddingBlock = false;

    /**
     * Renders the block-tile as a square.
     */
    @Input()
    public isSquare = false;

    /**
     * Input for the primary block content.
     * Only string for the source of a picture or text.
     */
    @Input()
    public block: string;

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
    public orientation: Orientation = 'horizontal';

    /**
     * Tells, whether the tile should display only one of `Title` or `Content` in the content part.
     */
    @Input()
    public only: ShowOnly = null;

    /**
     * Boolean, if the block-part of the tile is shown or not.
     */
    private _showBlockNode: boolean;

    /**
     * To decide, whether the block-node should always be shown.
     * Otherwise this will decide automatically.
     *
     * @param show Whether the block-part should be shown or not.
     */
    @Input()
    public set showBlockNode(show: boolean) {
        this._showBlockNode = show;
    }

    /**
     * @returns A boolean whether the block-part of the tile should be shown.
     * If this is not set manually, it will return `true` for the first time to check,
     * if this part contains any nodes.
     */
    public get showBlockNode(): boolean {
        return typeof this._showBlockNode === 'undefined' ? true : this._showBlockNode;
    }

    /**
     * Boolean, if the content-part of the tile is shown or not.
     */
    private _showContentNode: boolean;

    /**
     * To decide, whether the content-node should always be shown.
     * Otherwise this will decide automatically.
     *
     * @param show Whether the content-part should be shown or not.
     */
    @Input()
    public set showContentNode(show: boolean) {
        this._showContentNode = show;
    }

    /**
     * @returns A boolean whether the content-part of the tile should be shown.
     * If this is not set manually, it will return `true` for the first time to check,
     * if this part contains any nodes.
     */
    public get showContentNode(): boolean {
        return typeof this._showContentNode === 'undefined'
            ? true
            : this._showContentNode || !!this.only || !!this.title;
    }

    /**
     * Boolean, if the part with actions of the tile is shown or not.
     */
    private _showActionNode: boolean;

    /**
     * Boolean, whether to show action buttons in the content part.
     *
     * @param show Whether the action-part should be shown or not.
     */
    @Input()
    public set showActions(show: boolean) {
        this._showActionNode = show;
    }

    /**
     * @returns A boolean whether the action-part of the tile should be shown.
     * If this is not set manually, it will return `true` for the first time to check,
     * if this part contains any nodes.
     */
    public get showActions(): boolean {
        return typeof this._showActionNode === 'undefined' ? true : this._showActionNode;
    }

    /**
     * Default constructor.
     *
     * @param cd ChangeDetectorRef
     */
    public constructor(private cd: ChangeDetectorRef) {
        super();
    }

    /**
     * AfterViewInit.
     *
     * Here it will check, if the visibility of the three parts of the tile is set manually.
     * If not, it will check, if the parts contain nodes to display or not.
     */
    public ngAfterViewInit(): void {
        if (typeof this._showBlockNode === 'undefined') {
            this.showBlockNode = this.checkForContent(this.blockNode);
        }
        if (typeof this._showContentNode === 'undefined') {
            this.showContentNode = this.checkForContent(this.contentNode);
        }
        if (typeof this._showActionNode === 'undefined') {
            this.showActions = this.checkForContent(this.actionNode);
        }
        this.cd.detectChanges();
    }

    /**
     * Function to test, whether the child-nodes of the given parent-element
     * are a comment or not. If not, then the parent-element contains content to display.
     *
     * @param parentElement The element whose child-nodes are tested.
     *
     * @returns `True`, if there is at least one node other than a comment.
     */
    private checkForContent(parentElement: ElementRef<HTMLElement>): boolean {
        if (!parentElement) {
            return false;
        }
        return Array.from(parentElement.nativeElement.childNodes).some(item => item.nodeType !== 8);
    }
}
