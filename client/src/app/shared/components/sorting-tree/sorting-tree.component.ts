import { Component, OnInit, ViewChild, Input, EventEmitter, Output, OnDestroy } from '@angular/core';
import { transferArrayItem } from '@angular/cdk/drag-drop';

import { ITreeOptions, TreeModel, TreeNode } from 'angular-tree-component';
import { auditTime } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';

import { Identifiable } from 'app/shared/models/base/identifiable';
import { Displayable } from 'app/shared/models/base/displayable';
import { OSTreeNode, TreeService } from 'app/core/services/tree.service';

/**
 * The data representation for the sort event.
 */
export interface OSTreeSortEvent<T> {
    /**
     * Gives all nodes to be inserted below the parent_id.
     */
    nodes: OSTreeNode<T>[];

    /**
     * Provides the parent id for the nodes array. Do not provide it, if it's the
     * full tree, e.g. when inserting a node into the first layer of the tree. The
     * name is not camelCase, because this format can be send to the server as is.
     */
    parent_id?: number;
}

@Component({
    selector: 'os-sorting-tree',
    templateUrl: './sorting-tree.component.html'
})
export class SortingTreeComponent<T extends Identifiable & Displayable> implements OnInit, OnDestroy {
    /**
     * The property key to get the parent id.
     */
    @Input()
    public parentIdKey: keyof T;

    /**
     * The property key used for the weight attribute.
     */
    @Input()
    public weightKey: keyof T;

    /**
     * An observable to recieve the models to display.
     */
    @Input()
    public set modelsObservable(models: Observable<T[]>) {
        if (!models) {
            return;
        }
        if (this.modelSubscription) {
            this.modelSubscription.unsubscribe();
        }
        this.modelSubscription = models.pipe(auditTime(10)).subscribe(items => {
            this.nodes = this.treeService.makeTree(items, this.weightKey, this.parentIdKey);
            setTimeout(() => this.tree.treeModel.expandAll());
        });
    }

    /**
     * Saves the current subscription to the model oberservable.
     */
    private modelSubscription: Subscription = null;

    /**
     * An event emitter for expanding an collapsing the whole tree. The parent component
     * can emit true or false to expand or collapse the tree.
     */
    @Input()
    public set expandCollapseAll(value: EventEmitter<boolean>) {
        value.subscribe(expand => {
            if (expand) {
                this.tree.treeModel.expandAll();
            } else {
                this.tree.treeModel.collapseAll();
            }
        });
    }

    /**
     * The event emitter for the sort event. The data is the representation for the
     * sorted part of the tree.
     */
    @Output()
    public readonly sort = new EventEmitter<OSTreeSortEvent<T>>();

    /**
     * Options for the tree. As a default drag and drop is allowed.
     */
    public treeOptions: ITreeOptions = {
        allowDrag: true,
        allowDrop: true
    };

    /**
     * The tree. THis reference is used to expand and collapse the tree
     */
    @ViewChild('tree')
    public tree: any;

    /**
     * This is our actual tree represented by our own nodes.
     */
    public nodes: OSTreeNode<T>[] = [];

    /**
     * Constructor. Adds the eventhandler for the drop event to the tree.
     */
    public constructor(private treeService: TreeService) {
        this.treeOptions.actionMapping = {
            mouse: {
                drop: this.drop.bind(this)
            }
        };
    }

    /**
     * Required by components using the selector as directive
     */
    public ngOnInit(): void {}

    /**
     * Closes all subscriptions/event emitters.
     */
    public ngOnDestroy(): void {
        if (this.modelSubscription) {
            this.modelSubscription.unsubscribe();
        }
        this.sort.complete();
    }

    /**
     * Handles the main drop event. Emits the sort event afterwards.
     *
     * @param tree The tree
     * @param node The affected node
     * @param $event The DOM event
     * @param param3 The previous and new position os the node
     */
    private drop(tree: TreeModel, node: TreeNode, $event: any, { from, to }: { from: any; to: any }): void {
        // check if dropped itself by going the tree upwards and check, if one of them is the "from"-node.
        let parent = to.parent;
        while (parent !== null) {
            if (from.id === parent.id) {
                return;
            }
            parent = parent.parent;
        }

        let parentId;
        const fromArray = from.parent.data.children;
        if (!to.parent.data.virtual) {
            parentId = to.parent.data.id;
        }
        if (!to.parent.data.children) {
            to.parent.data.children = [];
        }
        transferArrayItem(fromArray, to.parent.data.children, from.index, to.index);
        this.sort.emit({ nodes: to.parent.data.children, parent_id: parentId });
    }
}
