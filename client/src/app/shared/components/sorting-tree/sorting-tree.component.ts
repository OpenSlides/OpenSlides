import { Component, OnInit, ViewChild, Input, EventEmitter, Output, OnDestroy } from '@angular/core';
import { transferArrayItem } from '@angular/cdk/drag-drop';

import { ITreeOptions, TreeModel, TreeNode } from 'angular-tree-component';
import { auditTime } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';

import { Identifiable } from 'app/shared/models/base/identifiable';
import { Displayable } from 'app/shared/models/base/displayable';

/**
 * An representation of our nodes. Saves the displayed name, the id and children to build a full tree.
 */
interface OSTreeNode {
    name: string;
    id: number;
    children?: OSTreeNode[];
}

/**
 * The data representation for the sort event.
 */
export interface OSTreeSortEvent {
    /**
     * Gives all nodes to be inserted below the parent_id.
     */
    nodes: OSTreeNode[];

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
        this.modelSubscription = models.pipe(auditTime(100)).subscribe(m => {
            this.nodes = this.makeTree(m);
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
    public readonly sort = new EventEmitter<OSTreeSortEvent>();

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
    public nodes: OSTreeNode[] = [];

    /**
     * Constructor. Adds the eventhandler for the drop event to the tree.
     */
    public constructor() {
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
        // check if dropped itself
        if (from.id === to.parent.id) {
            return;
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

    /**
     * Returns the weight casted to a number from a given model.
     *
     * @param model The model to get the weight from.
     * @returns the weight of the model
     */
    private getWeight(model: T): number {
        return (<any>model[this.weightKey]) as number;
    }

    /**
     * Returns the parent id casted to a number from a given model.
     *
     * @param model The model to get the parent id from.
     * @returns the parent id of the model
     */
    private getParentId(model: T): number {
        return (<any>model[this.parentIdKey]) as number;
    }

    /**
     * Build our representation of a tree node given the model and optional children
     * to append to this node.
     *
     * @param model The model to create a node of.
     * @param children Optional children to append to this node.
     * @returns The created node.
     */
    private buildTreeNode(model: T, children?: OSTreeNode[]): OSTreeNode {
        return {
            name: model.getTitle(),
            id: model.id,
            children: children
        };
    }

    /**
     * Creates a tree from the given models with their parent and weight properties.
     *
     * @param models All models to build the tree of
     * @returns The first layer of the tree given as an array of nodes, because this tree may not have a single root.
     */
    private makeTree(models: T[]): OSTreeNode[] {
        // copy references to avoid side effects:
        models = models.map(x => x);

        // Sort items after there weight
        models.sort((a, b) => this.getWeight(a) - this.getWeight(b));

        // Build a dict with all children (dict-value) to a specific
        // item id (dict-key).
        const children: { [parendId: number]: T[] } = {};

        models.forEach(model => {
            if (model[this.parentIdKey]) {
                const parentId = this.getParentId(model);
                if (children[parentId]) {
                    children[parentId].push(model);
                } else {
                    children[parentId] = [model];
                }
            }
        });

        // Recursive function that generates a nested list with all
        // items with there children
        const getChildren: (_models?: T[]) => OSTreeNode[] = _models => {
            if (!_models) {
                return;
            }
            const nodes: OSTreeNode[] = [];
            _models.forEach(_model => {
                nodes.push(this.buildTreeNode(_model, getChildren(children[_model.id])));
            });
            return nodes;
        };

        // Generates the list of root items (with no parents)
        const parentItems = models.filter(model => !this.getParentId(model));
        return getChildren(parentItems);
    }
}
