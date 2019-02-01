import { Injectable } from '@angular/core';

import { OpenSlidesComponent } from 'app/openslides.component';
import { Displayable } from 'app/site/base/displayable';
import { Identifiable } from 'app/shared/models/base/identifiable';

/**
 * A representation of nodes in our tree. Saves the displayed name, the id, the element and children to build a full tree.
 */
export interface OSTreeNode<T> {
    name: string;
    id: number;
    item: T;
    children?: OSTreeNode<T>[];
}

/**
 * This services handles all operations belonging to trees. It can build trees of plain lists (giving the weight
 * and parentId property) and traverse the trees in pre-order.
 */
@Injectable({
    providedIn: 'root'
})
export class TreeService extends OpenSlidesComponent {
    /**
     * Yes, a constructor.
     */
    public constructor() {
        super();
    }

    /**
     * Returns the weight casted to a number from a given model.
     *
     * @param item The model to get the weight from.
     * @param key
     * @returns the weight of the model
     */
    private getAttributeAsNumber<T extends Identifiable & Displayable>(item: T, key: keyof T): number {
        return (<any>item[key]) as number;
    }

    /**
     * Build our representation of a tree node given the model and optional children
     * to append to this node.
     *
     * @param item The model to create a node of.
     * @param children Optional children to append to this node.
     * @returns The created node.
     */
    private buildTreeNode<T extends Identifiable & Displayable>(item: T, children?: OSTreeNode<T>[]): OSTreeNode<T> {
        return {
            name: item.getTitle(),
            id: item.id,
            item: item,
            children: children
        };
    }

    /**
     * Builds a tree from the given items on the relations between items with weight and parentId
     *
     * @param items All items to traverse
     * @param weightKey The key giving access to the weight property
     * @param parentIdKey The key giving access to the parentId property
     * @returns An iterator for all items in the right order.
     */
    public makeTree<T extends Identifiable & Displayable>(
        items: T[],
        weightKey: keyof T,
        parentIdKey: keyof T
    ): OSTreeNode<T>[] {
        // Sort items after their weight
        items.sort((a, b) => this.getAttributeAsNumber(a, weightKey) - this.getAttributeAsNumber(b, weightKey));
        // Build a dict with all children (dict-value) to a specific
        // item id (dict-key).
        const children: { [parendId: number]: T[] } = {};
        items.forEach(model => {
            if (model[parentIdKey]) {
                const parentId = this.getAttributeAsNumber(model, parentIdKey);
                if (children[parentId]) {
                    children[parentId].push(model);
                } else {
                    children[parentId] = [model];
                }
            }
        });
        // Recursive function that generates a nested list with all
        // items with there children
        const getChildren: (_models?: T[]) => OSTreeNode<T>[] = _models => {
            if (!_models) {
                return;
            }
            const nodes: OSTreeNode<T>[] = [];
            _models.forEach(_model => {
                nodes.push(this.buildTreeNode(_model, getChildren(children[_model.id])));
            });
            return nodes;
        };
        // Generates the list of root items (with no parents)
        const parentItems = items.filter(model => !this.getAttributeAsNumber(model, parentIdKey));
        return getChildren(parentItems);
    }

    /**
     * Traverses the given tree in pre order.
     *
     * @param tree The tree to traverse
     * @returns An iterator for all items in the right order.
     */
    public *traverseTree<T>(tree: OSTreeNode<T>[]): Iterator<T> {
        const nodesToVisit = tree.reverse();
        while (nodesToVisit.length > 0) {
            const node = nodesToVisit.pop();
            if (node.children) {
                node.children.reverse().forEach(n => {
                    nodesToVisit.push(n);
                });
            }
            yield node.item;
        }
    }

    /**
     * Traverses items in pre-order givem (implicit) by the weight and parentId.
     *
     * Just builds the tree with `makeTree` and get the iterator from `traverseTree`.
     *
     * @param items All items to traverse
     * @param weightKey The key giving access to the weight property
     * @param parentIdKey The key giving access to the parentId property
     * @returns An iterator for all items in the right order.
     */
    public traverseItems<T extends Identifiable & Displayable>(
        items: T[],
        weightKey: keyof T,
        parentIdKey: keyof T
    ): Iterator<T> {
        const tree = this.makeTree(items, weightKey, parentIdKey);
        return this.traverseTree(tree);
    }
}
