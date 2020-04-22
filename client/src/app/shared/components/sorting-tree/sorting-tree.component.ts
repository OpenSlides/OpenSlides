import { ArrayDataSource } from '@angular/cdk/collections';
import { CdkDragMove, CdkDragSortEvent, CdkDragStart } from '@angular/cdk/drag-drop';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, ContentChild, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef } from '@angular/core';

import { Observable, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';

import { SortDefinition } from 'app/core/ui-services/base-sort.service';
import { TreeSortService } from 'app/core/ui-services/tree-sort.service';
import { FlatNode, TreeIdNode, TreeService } from 'app/core/ui-services/tree.service';
import { Identifiable } from 'app/shared/models/base/identifiable';
import { Displayable } from 'app/site/base/displayable';

/**
 * Enumaration to separate between the directions.
 */
enum Direction {
    UPWARDS = 'upwards',
    DOWNWARDS = 'downwards',
    RIGHT = 'right',
    LEFT = 'left',
    NOWAY = 'noway'
}

/**
 * Interface which extends the `OSFlatNode`.
 * Containing further information like start- and next-position.
 */
interface ExFlatNode<T extends Identifiable & Displayable> extends FlatNode<T> {
    startPosition: number;
    nextPosition: number;
}

/**
 * Interface to hold the start position and the current position.
 */
interface DragEvent {
    position: { x: number; y: number };
    currentPosition: { x: number; y: number };
}

/**
 * Class to hold the moved steps and the direction in horizontal and vertical way.
 */
class Movement {
    public verticalMove: Direction.DOWNWARDS | Direction.UPWARDS | Direction.NOWAY;
    public horizontalMove: Direction.LEFT | Direction.NOWAY | Direction.RIGHT;
    public steps: number;
}

@Component({
    selector: 'os-sorting-tree',
    templateUrl: './sorting-tree.component.html',
    styleUrls: ['./sorting-tree.component.scss']
})
export class SortingTreeComponent<T extends Identifiable & Displayable> implements OnInit, OnDestroy {
    /**
     * Declare the templateRef to coexist between parent in child
     */
    @ContentChild(TemplateRef, { static: true })
    public templateRef: TemplateRef<T>;

    /**
     * The data to build the tree
     */
    public osTreeData: FlatNode<T>[] = [];

    /**
     * The tree control
     */
    public treeControl = new FlatTreeControl<FlatNode<T>>(
        node => node.level,
        node => node.expandable
    );

    /**
     * Source for the tree
     */
    public dataSource = new ArrayDataSource(this.osTreeData);

    /**
     * Number to calculate the next position the node is moved
     */
    private nextPosition = 0;

    /**
     * Number which defines the level of the placeholder.
     * Necessary to show the placeholder for the moved node correctly.
     */
    public placeholderLevel = 0;

    /**
     * Node with calculated next information.
     * Containing information like the position, when the drag starts and where it is in the moment.
     */
    public nextNode: ExFlatNode<T> = null;

    /**
     * Pointer for the move event
     */
    private pointer: DragEvent = null;

    /**
     * Number, that holds the current visible nodes.
     */
    private seenNodes: number;

    /**
     * Function that will be used for filtering the nodes.
     * Should return false for an item is to be visible
     * TODO this inverts all other 'sorting' conventions elsewhere!
     */
    private activeFilter: (node: T) => boolean;

    /**
     * Subscription for the data store
     */
    private modelSubscription: Subscription = null;

    /**
     * Reference to the model that is passed to this component
     */
    private _model: Observable<T[]> = null;

    /**
     * Input that defines the key for the parent id
     */
    @Input()
    public parentKey: keyof T;

    /**
     * Input that defines the key for the weight of the items.
     * The weight defines the order of the items.
     */
    @Input()
    public weightKey: keyof T;

    /**
     * Setter to get all models from data store.
     * It will create or replace the existing subscription.
     *
     * @param model Is the model the tree will be built of.
     */
    @Input()
    public set model(model: Observable<T[]>) {
        if (!model) {
            return;
        }
        this._model = model;
        this.setSubscription();
    }

    /**
     * Setter to listen for state changes, expanded or collapsed.
     *
     * @param nextState Is an event emitter that emits a boolean whether the nodes should expand or not.
     */
    @Input()
    public set stateChange(nextState: EventEmitter<Boolean>) {
        nextState.subscribe((state: boolean) => {
            if (state) {
                this.expandAll();
            } else {
                this.collapseAll();
            }
        });
    }

    /**
     * Setter to listen for filter change events.
     *
     * @param filter Is an event emitter that emits all active filters in an array.
     */
    @Input()
    public set filterChange(filter: EventEmitter<(node: T) => boolean>) {
        filter.subscribe((value: (node: T) => boolean) => {
            this.activeFilter = value;
            this.checkActiveFilters();
        });
    }

    /**
     * Setter for sorting functions.
     *
     * @param predicate An `EventEmitter` to push to sort the tree by the passed property.
     * It should pass a `SortDefinition`.
     */
    @Input()
    public set sortingDefinition(predicate: EventEmitter<SortDefinition<T>>) {
        predicate.subscribe((event: SortDefinition<T>) => {
            this.resolveSortingPredicate(event);
        });
    }

    /**
     * EventEmitter to send info if changes has been made.
     */
    @Output()
    public hasChanged: EventEmitter<boolean> = new EventEmitter<boolean>();

    /**
     * EventEmitter to emit the info about the currently shown nodes.
     */
    @Output()
    public visibleNodes: EventEmitter<[number, number]> = new EventEmitter<[number, number]>();

    /**
     * Reference to the template content.
     */
    @ContentChild(TemplateRef, { static: true })
    public innerNode: TemplateRef<any>;

    /**
     * Constructor
     *
     * @param treeService Service to get data from store and build the tree nodes.
     * @param sortService Service to sort tree nodes by their given items.
     */
    public constructor(private treeService: TreeService, private sortService: TreeSortService<T>) {}

    /**
     * On init method
     */
    public ngOnInit(): void {}

    /**
     * On destroy - unsubscribe the subscription
     */
    public ngOnDestroy(): void {
        this.removeSubscription();
    }

    /**
     * Function to check if the node has a parent.
     *
     * @param node which is viewed.
     *
     * @returns The parent node if available otherwise it returns null.
     */
    public getParentNode(node: FlatNode<T>): FlatNode<T> {
        const nodeIndex = this.osTreeData.indexOf(node);

        for (let i = nodeIndex - 1; i >= 0; --i) {
            if (this.osTreeData[i].level === node.level - 1) {
                return this.osTreeData[i];
            }
        }

        return null;
    }

    /**
     * This function check if the parent of one node is expanded or not.
     * Necessary to check if the user swaps over a child or the parent of the next node.
     *
     * @param node is the node which is the next node the user could step over.
     *
     * @returns The node which is either the parent if not expanded or the next node.
     */
    private getExpandedParentNode(node: FlatNode<T>): FlatNode<T> {
        for (let i = node.position; i >= 0; --i) {
            const treeNode = this.osTreeData[i];
            if (treeNode.isSeen && !treeNode.filtered) {
                return treeNode;
            }
        }
        return node;
    }

    /**
     * Function to search for all parents over the given node.
     *
     * @param node is the affected node.
     *
     * @returns An array containing its parent and the parents of its parent.
     */
    private getAllParents(node: FlatNode<T>): FlatNode<T>[] {
        return this._getAllParents(node, []);
    }

    /**
     * Function to search recursively for all parents, that are in relation to the given node.
     *
     * @param node is the affected node.
     * @param array is the array which contains the parents.
     *
     * @returns An array containing all parents that are in relation to the given node.
     */
    private _getAllParents(node: FlatNode<T>, array: FlatNode<T>[]): FlatNode<T>[] {
        const parent = this.getParentNode(node);
        if (parent) {
            array.push(parent);
            return this._getAllParents(parent, array);
        } else {
            return array;
        }
    }

    /**
     * Function to get all nodes under the given node with level + 1.
     *
     * @param node The parent of the searched children.
     *
     * @returns An array that contains all the nearest children.
     */
    public getChildNodes(node: FlatNode<T>): FlatNode<T>[] {
        const nodeIndex = this.osTreeData.indexOf(node);
        const childNodes: FlatNode<T>[] = [];

        if (nodeIndex < this.osTreeData.length - 1) {
            for (let i = nodeIndex + 1; i < this.osTreeData.length && this.osTreeData[i].level >= node.level + 1; ++i) {
                if (this.osTreeData[i].level === node.level + 1) {
                    childNodes.push(this.osTreeData[i]);
                }
            }
        }

        return childNodes;
    }

    /**
     * Function to search for all nodes under the given node, that are not filtered.
     *
     * @param node is the parent whose visible children should be returned.
     *
     * @returns An array containing all nodes that are children and not filtered.
     */
    private getUnfilteredChildNodes(node: FlatNode<T>): FlatNode<T>[] {
        return this.getChildNodes(node).filter(child => !child.filtered);
    }

    /**
     * Function to look for all nodes that are under the given node.
     * This includes not only the nearest children, but also the children of the children.
     *
     * @param node The parent of the nodes.
     *
     * @returns An array containing all the subnodes, inclusive the children of the children.
     */
    private getAllSubNodes(node: FlatNode<T>): FlatNode<T>[] {
        return this._getAllSubNodes(node, []);
    }

    /**
     * Function iterates through the array of children.
     * `Warning: Side Effects`: The passed array will be filled.
     *
     * @param node The parent of the nodes.
     * @param array The existing array containing all subnodes
     *
     * @returns An array containing all subnodes, inclusive the children of the children.
     */
    private _getAllSubNodes(node: FlatNode<T>, array: FlatNode<T>[]): FlatNode<T>[] {
        array.push(node);
        for (const child of this.getChildNodes(node)) {
            this._getAllSubNodes(child, array);
        }
        return array;
    }

    /**
     * Function to check the position in the list that is shown.
     * This is necessary to identify the calculated position from CdkDragDrop.
     *
     * @param node The node whose position at the shown list should be checked.
     *
     * @returns The calculated position as number.
     */
    private getPositionOnScreen(node: FlatNode<T>): number {
        let currentPosition = this.osTreeData.length;
        for (let i = this.osTreeData.length - 1; i >= 0; --i) {
            --currentPosition;
            const parent = this.getExpandedParentNode(this.osTreeData[i]);
            if (parent === node) {
                break;
            } else {
                i = parent.position;
            }
        }
        return currentPosition;
    }

    /**
     * Function to check if the node should render.
     *
     * @param node which is viewed.
     *
     * @returns boolean if the node should render. Related to the state of the parent, if expanded or not.
     */
    public shouldRender(node: FlatNode<T>): boolean {
        return node.isSeen;
    }

    /**
     * Function, that handles the click on a node.
     *
     * @param node which is clicked.
     */
    public handleClick(node: FlatNode<T>): void {
        node.isExpanded = !node.isExpanded;
        if (node.isExpanded) {
            for (const child of this.getChildNodes(node)) {
                this.showChildren(child);
            }
        } else {
            const allChildren = this.getAllSubNodes(node);
            for (let i = 1; i < allChildren.length; ++i) {
                allChildren[i].isSeen = false;
            }
        }
    }

    /**
     * Function to show children if the parent has expanded.
     *
     * @param node is the node which should be shown again.
     */
    private showChildren(node: FlatNode<T>): void {
        this.checkVisibility(node);
        if (node.expandable && node.isExpanded) {
            for (const child of this.getChildNodes(node)) {
                this.showChildren(child);
            }
        }
    }

    /**
     * Function to check the visibility of moved nodes after moving them.
     * `Warning: Side Effects`: This function works with side effects. The changed nodes won't be returned!
     *
     * @param node All affected nodes, that are either shown or not.
     */
    private checkVisibility(node: FlatNode<T>): void {
        const shouldSee = !this.getAllParents(node).find(item => (item.expandable && !item.isExpanded) || !item.isSeen);
        node.isSeen = !node.filtered && shouldSee;
    }

    /**
     * Find the next not filtered node.
     * Necessary to get the next node even though it is not seen.
     *
     * @param node is the directly next neighbor of the moved node.
     * @param direction define in which way it runs.
     *
     * @returns The next node with parameter `isSeen = true`.
     */
    private getNextVisibleNode(node: FlatNode<T>, direction: Direction.DOWNWARDS | Direction.UPWARDS): FlatNode<T> {
        if (node) {
            switch (direction) {
                case Direction.DOWNWARDS:
                    for (let i = node.position; i < this.osTreeData.length; ++i) {
                        if (!this.osTreeData[i].filtered) {
                            return this.osTreeData[i];
                        }
                    }
                    break;

                case Direction.UPWARDS:
                    for (let i = node.position; i >= 0; --i) {
                        if (!this.osTreeData[i].filtered) {
                            return this.osTreeData[i];
                        }
                    }
                    break;
            }
        }
        return null;
    }

    /**
     * Function to get the last filtered child of a node.
     * This is necessary to append moved nodes next to the last place of the corresponding parent.
     *
     * @param node is the node where it will start.
     *
     * @returns The node that is an filtered child or itself if there is no filtered child.
     */
    private getTheLastInvisibleNode(node: FlatNode<T>): FlatNode<T> {
        let result = node;
        for (let i = node.position + 1; i < this.osTreeData.length && this.osTreeData[i].level >= node.level + 1; ++i) {
            if (this.osTreeData[i].filtered) {
                result = this.osTreeData[i];
            } else {
                return result;
            }
        }
        return node;
    }

    /**
     * Function to calculate the next position of the moved node.
     * So, the user could see where he moves the node.
     *
     * @param event The CdkDragSortEvent which emits the event
     */
    public sortItems(event: CdkDragSortEvent): void {
        this.nextNode.nextPosition = event.currentIndex;
        this.calcNextPosition();
    }

    /**
     * Initializes the `this.pointer` with the x- and y-coordinates,
     * where the user starts the dragging.
     *
     * @param x The value of the x-position on screen.
     * @param y The value of the y-position on screen.
     */
    private initPointer(x: number, y: number): void {
        this.pointer = {
            position: {
                x,
                y
            },
            currentPosition: {
                x,
                y
            }
        };
    }

    /**
     * Function to set the cursor position immediately if the user starts dragging a node.
     *
     * @param event The mouse event which emits the event.
     */
    public mouseDown(event: MouseEvent): void {
        this.initPointer(event.x, event.y);
    }

    public touchStart(event: TouchEvent): void {
        const { clientX, clientY }: { clientX: number; clientY: number } = event.touches[0];
        this.initPointer(Math.round(clientX), Math.round(clientY));
    }

    /**
     * If the user stops moving a node and he does not drag it, then the pointer would be set to null.
     */
    public mouseUp(): void {
        this.pointer = null;
    }

    /**
     * Function to initiate the dragging.
     *
     * @param event CdkDragStart which emits the event
     */
    public startsDrag(event: CdkDragStart): void {
        this.removeSubscription();
        const draggedNode = <FlatNode<T>>event.source.data;
        this.placeholderLevel = draggedNode.level;
        this.nextNode = {
            ...draggedNode,
            startPosition: this.getPositionOnScreen(draggedNode),
            nextPosition: this.getPositionOnScreen(draggedNode)
        };
    }

    /**
     * Function to handle the dropping of a node.
     *
     * @param node Is the dropped node.
     */
    public onDrop(node: FlatNode<T>): void {
        this.pointer = null;

        this.madeChanges(true);
        this.moveItemToTree(node, node.position, this.nextPosition, this.placeholderLevel);
    }

    /**
     * Function to handle the moving of an item.
     * Fires, when an item is moved.
     *
     * @param event the drag event for 'drag move'.
     */
    public moveItem(event: CdkDragMove): void {
        this.pointer.currentPosition = event.pointerPosition;
        this.calcNextPosition();
    }

    /**
     * Function to calculate the direction of the moving of a node.
     *
     * @returns `Movement` object which contains horizontal and vertical movement.
     */
    private getDirection(): Movement {
        const movement = new Movement();
        if (this.nextNode.startPosition < this.nextNode.nextPosition) {
            movement.verticalMove = Direction.DOWNWARDS;
        } else if (this.nextNode.startPosition > this.nextNode.nextPosition) {
            movement.verticalMove = Direction.UPWARDS;
        } else {
            movement.verticalMove = Direction.NOWAY;
        }
        const deltaX = this.pointer.currentPosition.x - this.pointer.position.x;
        movement.steps = Math.trunc(deltaX / 40);
        if (movement.steps > 0) {
            movement.horizontalMove = Direction.RIGHT;
        } else if (movement.steps < 0) {
            movement.horizontalMove = Direction.LEFT;
        } else {
            movement.horizontalMove = Direction.NOWAY;
        }
        return movement;
    }

    /**
     * Function to calculate the position, where the node is being moved.
     * First it separates between the different vertical movements.
     */
    private calcNextPosition(): void {
        const steps = this.osTreeData.length - this.nextNode.nextPosition - 1;
        const direction = this.getDirection();
        const nextPosition = this.findNextIndex(steps, this.nextNode, direction.verticalMove);
        this.nextPosition = nextPosition;

        const corrector = direction.verticalMove === Direction.DOWNWARDS ? 0 : 1;
        let possibleParent = this.osTreeData[nextPosition - corrector];
        for (let i = 0; possibleParent && possibleParent.filtered; ++i) {
            possibleParent = this.osTreeData[nextPosition - corrector - i];
        }
        if (possibleParent) {
            this.nextPosition = this.getTheLastInvisibleNode(possibleParent).position + corrector;
        }
        switch (direction.horizontalMove) {
            case Direction.LEFT:
                if (this.nextNode.level > 0 || this.placeholderLevel > 0) {
                    const nextLevel = this.nextNode.level + direction.steps;
                    if (nextLevel >= 0) {
                        this.placeholderLevel = nextLevel;
                    } else {
                        this.placeholderLevel = 0;
                    }
                }
                break;

            case Direction.RIGHT:
                if (possibleParent) {
                    const nextLevel = this.nextNode.level + direction.steps;
                    if (nextLevel <= possibleParent.level) {
                        this.placeholderLevel = nextLevel;
                    } else {
                        this.placeholderLevel = possibleParent.level + 1;
                    }
                } else {
                    this.placeholderLevel = 0;
                }
                break;

            case Direction.NOWAY:
                if (!possibleParent) {
                    if (this.nextNode.level <= possibleParent.level + 1) {
                        this.placeholderLevel = this.nextNode.level;
                    } else {
                        this.placeholderLevel = possibleParent.level + 1;
                    }
                } else {
                    this.placeholderLevel = 0;
                }
                break;
        }
    }

    /**
     * Function to calculate the next index for the dragged node.
     *
     * @param steps Are the caluclated steps the item will be dropped.
     * @param node Is the corresponding node which is dragged.
     * @param verticalMove Is the direction in the vertical way.
     *
     * @returns The next position of the node in the array.
     */
    private findNextIndex(
        steps: number,
        node: ExFlatNode<T>,
        verticalMove: Direction.DOWNWARDS | Direction.UPWARDS | Direction.NOWAY
    ): number {
        let currentPosition = this.osTreeData.length;
        switch (verticalMove) {
            case Direction.UPWARDS:
                for (let i = 0; i < steps; ++i) {
                    const parent = this.getExpandedParentNode(this.osTreeData[currentPosition - 1]);
                    if (parent) {
                        currentPosition = parent.position;
                    } else {
                        break;
                    }
                    if (node.item.getTitle() === parent.item.getTitle()) {
                        --i;
                    }
                }
                break;

            case Direction.DOWNWARDS:
                currentPosition -= 1;
                for (let i = 0; i < steps; ++i) {
                    const parent = this.getExpandedParentNode(this.osTreeData[currentPosition]);
                    if (parent) {
                        currentPosition = parent.position - 1;
                    } else {
                        break;
                    }
                }
                break;

            case Direction.NOWAY:
                currentPosition = node.position;
                break;
        }
        return currentPosition;
    }

    /**
     * Function to re-sort the tree, when a node was dropped.
     *
     * @param node The corresponding node.
     * @param previousIndex The previous index of the node in the array.
     * @param nextIndex The next calculated index of the node in the array.
     * @param nextLevel The next level the node should have.
     * @param verticalMove The direction of the movement in the vertical way.
     */
    private moveItemToTree(node: FlatNode<T>, previousIndex: number, nextIndex: number, nextLevel: number): void {
        let verticalMove: string;
        if (previousIndex < nextIndex) {
            verticalMove = Direction.DOWNWARDS;
        } else if (previousIndex > nextIndex) {
            verticalMove = Direction.UPWARDS;
        } else {
            verticalMove = Direction.NOWAY;
        }

        // Get all affected nodes.
        const movedNodes = this.getAllSubNodes(node);
        const corrector = verticalMove === Direction.DOWNWARDS ? 0 : 1;
        const lastChildIndex = movedNodes[movedNodes.length - 1].position;

        // Get the neighbor above and below of the new index.
        const nextNeighborAbove = this.getNextVisibleNode(this.osTreeData[nextIndex - corrector], Direction.UPWARDS);
        const nextNeighborBelow =
            verticalMove !== Direction.NOWAY
                ? this.osTreeData[nextIndex - corrector + 1]
                : this.osTreeData[lastChildIndex + 1];

        // Check if there is a change at all.
        if ((nextIndex !== previousIndex || node.level !== nextLevel) && !movedNodes.includes(nextNeighborAbove)) {
            // move something only if there is a change
            const levelDifference = nextLevel - node.level;

            // Check if the node was a subnode.
            if (node.level > 0) {
                // const previousNode = this.osTreeData[previousIndex - 1];
                const previousNode = this.getNextVisibleNode(this.osTreeData[previousIndex - 1], Direction.UPWARDS);
                const onlyChild = this.getUnfilteredChildNodes(previousNode).length === 1;
                const isMovedLowerLevel = previousIndex === nextIndex && nextLevel <= previousNode.level && onlyChild;
                const isMovedAway = previousIndex !== nextIndex && onlyChild;

                // Check if the previous parent will have no children anymore.
                if (isMovedAway || isMovedLowerLevel) {
                    previousNode.expandable = false;
                    previousNode.isExpanded = false;
                }
            }

            // Check if the node becomes a subnode.
            if (nextLevel > 0) {
                const noChildren = this.getUnfilteredChildNodes(nextNeighborAbove).length === 0;
                // Check if the new parent has not have any children before.
                if (nextNeighborAbove.level + 1 === nextLevel && noChildren) {
                    nextNeighborAbove.expandable = true;
                    nextNeighborAbove.isExpanded =
                        (!!this.getParentNode(nextNeighborAbove) && this.getParentNode(nextNeighborAbove).isExpanded) ||
                        noChildren;
                }
            }

            // Check if the neighbor below has a higher level than the moved node.
            if (nextNeighborBelow && nextNeighborBelow.level === nextLevel + 1 && !nextNeighborBelow.filtered) {
                // Check if the new neighbor above has the same level like the moved node.
                if (nextNeighborAbove.level === nextLevel) {
                    nextNeighborAbove.expandable = false;
                    nextNeighborAbove.isExpanded = false;
                }
                node.expandable = true;
                node.isExpanded = true;
            }

            // Check if the neighbor below has a level equals to two or more higher than the moved node.
            if (nextNeighborBelow) {
                if (
                    nextNeighborBelow.level >= nextLevel + 2 ||
                    (nextNeighborBelow.level === nextLevel + 1 && nextNeighborBelow.filtered)
                ) {
                    let found = false;
                    for (let i = nextIndex + 1; i < this.osTreeData.length; ++i) {
                        if (this.osTreeData[i].level <= nextLevel && node !== this.osTreeData[i]) {
                            found = true;
                            nextIndex = verticalMove === Direction.UPWARDS ? i : i - 1;
                            break;
                        } else if (node === this.osTreeData[i] && this.osTreeData[i + 1].level <= nextLevel + 1) {
                            // Remain at the same position and change only the level if changed.
                            nextIndex = previousIndex;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        nextIndex = this.osTreeData.length - 1;
                    }
                    if (verticalMove === Direction.NOWAY || previousIndex < nextIndex) {
                        verticalMove = Direction.DOWNWARDS;
                    }
                }
            }

            // Handles the moving upwards
            if (verticalMove === Direction.UPWARDS) {
                const difference = Math.abs(nextIndex - previousIndex);
                // Moves the other nodes starting from the next index to the previous index.
                for (let i = 1; i <= difference; ++i) {
                    const currentIndex = previousIndex + movedNodes.length - i;
                    this.osTreeData[currentIndex] = this.osTreeData[currentIndex - movedNodes.length];
                    this.osTreeData[currentIndex].position = currentIndex;
                }

                // Moves the affected nodes back to the array starting at the `nextIndex`.
                for (let i = 0; i < movedNodes.length; ++i) {
                    this.osTreeData[nextIndex + i] = movedNodes[i];
                    this.osTreeData[nextIndex + i].position = nextIndex + i;
                    this.osTreeData[nextIndex + i].level += levelDifference;
                }

                // Handles the moving downwards
            } else if (verticalMove === Direction.DOWNWARDS) {
                const difference = Math.abs(nextIndex - previousIndex) - (movedNodes.length - 1);
                for (let i = 0; i < difference; ++i) {
                    const currentIndex = previousIndex + movedNodes.length + i;
                    this.osTreeData[previousIndex + i] = this.osTreeData[currentIndex];
                    this.osTreeData[previousIndex + i].position = previousIndex + i;
                }
                for (let i = 0; i < movedNodes.length; ++i) {
                    this.osTreeData[nextIndex - i] = movedNodes[movedNodes.length - i - 1];
                    this.osTreeData[nextIndex - i].position = nextIndex - i;
                    this.osTreeData[nextIndex - i].level += levelDifference;
                }

                // Handles the moving in the same direction
            } else {
                for (let i = 0; i < movedNodes.length; ++i) {
                    this.osTreeData[nextIndex + i].level += levelDifference;
                }
            }

            // Check the visibility to prevent seeing nodes that are actually unseen.
            for (const child of movedNodes) {
                this.checkVisibility(child);
            }

            // Set a new data source.
            this.dataSource = null;
            this.dataSource = new ArrayDataSource(this.osTreeData);
        }
    }

    /**
     * Function to get the data from tree.
     *
     * @returns An array that contains all necessary information to see the connections between the nodes
     * and their subnodes.
     */
    public getTreeData(): TreeIdNode[] {
        return this.treeService.makeTreeFromFlatTree(this.osTreeData);
    }

    /**
     * Function to remove the current subscription to prevent overwriting the changes made from user.
     */
    private removeSubscription(): void {
        if (this.modelSubscription) {
            this.modelSubscription.unsubscribe();
            this.modelSubscription = null;
        }
    }

    /**
     * Function to (re-) set the subscription to recognize changes.
     */
    public setSubscription(): void {
        this.removeSubscription();
        this.madeChanges(false);
        this.modelSubscription = this._model.pipe(auditTime(10)).subscribe(values => {
            this.osTreeData = this.treeService.makeFlatTree(values, this.weightKey, this.parentKey);
            this.checkActiveFilters();
            this.dataSource = new ArrayDataSource(this.osTreeData);
        });
    }

    /**
     * Function to emit the boolean if changes has been made or not.
     *
     * @param hasChanged Boolean that will be emitted.
     */
    private madeChanges(hasChanged: boolean): void {
        this.hasChanged.emit(hasChanged);
    }

    /**
     * Function to expand all nodes.
     */
    private expandAll(): void {
        for (const child of this.osTreeData) {
            this.checkVisibility(child);
            if (child.isSeen && child.expandable) {
                child.isExpanded = true;
            }
        }
    }

    /**
     * Function to collapse all parent nodes and make their children invisible.
     */
    private collapseAll(): void {
        for (const child of this.osTreeData) {
            child.isExpanded = false;
            if (child.level > 0) {
                child.isSeen = false;
            }
        }
    }

    /**
     * Function that iterates over all top level nodes and pass them to the next function
     * to decide if they will be seen or filtered and whether they will be expandable.
     */
    private checkActiveFilters(): void {
        this.seenNodes = 0;
        for (const node of this.osTreeData.filter(item => item.level === 0)) {
            this.checkChildrenToBeFiltered(node);
        }
        this.visibleNodes.emit([this.seenNodes, this.osTreeData.length]);
    }

    /**
     * Function to check recursively the child nodes of a given node whether they will be filtered
     * or if they should be seen.
     * The result is necessary to decide whether the parent node is expandable or not.
     *
     * @param node is the inspected node.
     * @param parent optional: If the node has a parent, it is necessary to see if this parent
     *               will be filtered or is seen.
     * @returns A boolean which describes if the given node will be filtered.
     */
    private checkChildrenToBeFiltered(node: FlatNode<T>, parent?: FlatNode<T>): boolean {
        let result = false;
        const willFiltered = this.activeFilter ? this.activeFilter(node.item) || (parent && parent.filtered) : false;
        node.filtered = willFiltered;
        const willSeen = !willFiltered && ((parent && parent.isSeen && parent.isExpanded) || !parent);
        node.isSeen = willSeen;
        if (willSeen) {
            this.seenNodes += 1;
        }
        for (const child of this.getChildNodes(node)) {
            if (!this.checkChildrenToBeFiltered(child, node)) {
                result = true;
            }
        }
        node.expandable = result;
        return willFiltered;
    }

    /**
     * Function to sort the given source-array by the passed property of the underlying items `<T>`.
     *
     * @param event `SortDefinition<T>` - can be only a `keyof T` or
     * an object defining the property and whether ascending order or not:
     * `{ property: keyof T, ascending: boolean }`.
     */
    private resolveSortingPredicate(event: SortDefinition<T>): void {
        this.removeSubscription();
        const sortProperty = typeof event === 'object' ? event.sortProperty : event;
        const sortAscending = typeof event === 'object' ? event.sortAscending : true;

        this.osTreeData = this.sortService.sortTree(this.osTreeData, sortProperty, sortAscending);
        this.checkActiveFilters();

        this.dataSource = null;
        this.dataSource = new ArrayDataSource(this.osTreeData);

        this.madeChanges(true);
    }

    /**
     * Function to check if a node has children.
     */
    public hasChild = (_: number, node: FlatNode<T>) => node.expandable;
}
