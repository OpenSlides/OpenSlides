import { Injectable } from '@angular/core';

import { Displayable } from 'app/site/base/displayable';
import { Identifiable } from 'app/shared/models/base/identifiable';

/**
 * A basic representation of a tree node. This node does not stores any data.
 */
export interface TreeIdNode {
    id: number;
    children?: TreeIdNode[];
}

/**
 * Extends the TreeIdNode with a name to display.
 */
export interface TreeNodeWithoutItem extends TreeIdNode {
    name: string;
    children?: TreeNodeWithoutItem[];
}

/**
 * A representation of nodes with the item atached.
 */
export interface OSTreeNode<T> extends TreeNodeWithoutItem {
    item: T;
    children?: OSTreeNode<T>[];
}

/**
 * Interface which defines the nodes for the sorting trees.
 *
 * Contains information like
 * item: The base item the node is created from.
 * level: The level of the node. The higher, the deeper the level.
 * position: The position in the array of the node.
 * isExpanded: Boolean if the node is expanded.
 * expandable: Boolean if the node is expandable.
 * id: The id of the node.
 * filtered: Optional boolean to check, if the node is filtered.
 */
export interface FlatNode<T> {
    item: T;
    level: number;
    position?: number;
    isExpanded?: boolean;
    isSeen: boolean;
    expandable: boolean;
    id: number;
    filtered?: boolean;
}

/**
 * This services handles all operations belonging to trees. It can build trees of plain lists (giving the weight
 * and parentId property) and traverse the trees in pre-order.
 */
@Injectable({
    providedIn: 'root'
})
export class TreeService {
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
     * Function to build flat nodes from `OSTreeNode`s.
     * Iterates recursively through the list of nodes.
     *
     * @param items
     * @param weightKey
     * @param parentKey
     *
     * @returns An array containing flat nodes.
     */
    public makeFlatTree<T extends Identifiable & Displayable>(
        items: T[],
        weightKey: keyof T,
        parentKey: keyof T
    ): FlatNode<T>[] {
        const tree = this.makeTree(items, weightKey, parentKey);
        const flatNodes: FlatNode<T>[] = [];
        for (const node of tree) {
            flatNodes.push(...this.makePartialFlatTree(node, 0));
        }
        for (let i = 0; i < flatNodes.length; ++i) {
            flatNodes[i].position = i;
        }
        return flatNodes;
    }

    /**
     * Function to convert a flat tree to a nested tree built from `OSTreeNodeWithOutItem`.
     *
     * @param nodes The array of flat nodes, which should be converted.
     *
     * @returns The tree with nested information.
     */
    public makeTreeFromFlatTree<T extends Identifiable & Displayable>(nodes: FlatNode<T>[]): TreeIdNode[] {
        const basicTree: TreeIdNode[] = [];

        for (let i = 0; i < nodes.length; ) {
            // build the next node inclusive its children
            const nextNode = this.buildBranchFromFlatTree(nodes[i], nodes, 0);
            // append this node to the tree
            basicTree.push(nextNode.node);
            // step to the next related item in the array
            i += nextNode.length;
        }

        return basicTree;
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
     * Removes `item` from the tree.
     *
     * @param tree The tree with items
     * @returns The tree without items
     */
    public stripTree<T>(tree: OSTreeNode<T>[]): TreeNodeWithoutItem[] {
        return tree.map(node => {
            const nodeWithoutItem: TreeNodeWithoutItem = {
                name: node.name,
                id: node.id
            };
            if (node.children) {
                nodeWithoutItem.children = this.stripTree(node.children);
            }
            return nodeWithoutItem;
        });
    }

    /**
     * Reduce a list of items to nodes independent from each other in a given
     * branch of a tree
     *
     * @param branch the tree to traverse
     * @param items the items to check
     * @returns the selection of items that belong to different branches
     */
    private getTopItemsFromBranch<T extends Identifiable & Displayable>(branch: OSTreeNode<T>, items: T[]): T[] {
        const item = items.find(i => branch.item.id === i.id);
        if (item) {
            return [item];
        } else if (!branch.children) {
            return [];
        } else {
            return [].concat(...branch.children.map(child => this.getTopItemsFromBranch(child, items)));
        }
    }

    /**
     * Reduce a list of items to nodes independent from each other in a given tree
     *
     * @param tree the tree to traverse
     * @param items the items to check
     * @returns the selection of items that belong to different branches
     */
    public getTopItemsFromTree<T extends Identifiable & Displayable>(tree: OSTreeNode<T>[], items: T[]): T[] {
        let results: T[] = [];
        tree.forEach(branch => {
            const i = this.getTopItemsFromBranch(branch, items);
            if (i.length) {
                results = results.concat(i);
            }
        });
        return results;
    }

    /**
     * Return all items not being hierarchically dependant on the items in the input arrray
     *
     * @param tree
     * @param items
     * @returns all items that are neither in the input nor dependants of  items in the input
     */
    public getTreeWithoutSelection<T extends Identifiable & Displayable>(tree: OSTreeNode<T>[], items: T[]): T[] {
        let result: T[] = [];
        tree.forEach(branch => {
            if (!items.find(i => i.id === branch.item.id)) {
                result.push(branch.item);
                if (branch.children) {
                    result = result.concat(this.getTreeWithoutSelection(branch.children, items));
                }
            }
        });
        return result;
    }

    /**
     * Helper function to go recursively through the children of given node.
     *
     * @param item The current item from which the flat node will be created.
     * @param level The level the flat node will be.
     * @param additionalTag Optional: A key of the items. If this parameter is set, the nodes will have a tag for filtering them.
     *
     * @returns An array containing the parent node with all its children.
     */
    private makePartialFlatTree<T extends Identifiable & Displayable>(
        item: OSTreeNode<T>,
        level: number
    ): FlatNode<T>[] {
        const children = item.children;
        const node: FlatNode<T> = {
            id: item.id,
            item: item.item,
            expandable: !!children,
            isExpanded: !!children,
            level: level,
            isSeen: true
        };
        const flatNodes: FlatNode<T>[] = [node];
        if (children) {
            for (const child of children) {
                flatNodes.push(...this.makePartialFlatTree(child, level + 1));
            }
        }
        return flatNodes;
    }

    /**
     * Function, that returns a node containing information like id, name and children.
     * Children only, if available.
     *
     * @param node The node which is converted.
     * @param nodes The array with all nodes to convert.
     * @param length The number of converted nodes related to the parent node.
     *
     * @returns `OSTreeNodeWithOutItem`
     */
    private buildBranchFromFlatTree<T extends Identifiable & Displayable>(
        node: FlatNode<T>,
        nodes: FlatNode<T>[],
        length: number
    ): { node: TreeIdNode; length: number } {
        const children = [];
        // Begins at the position of the node in the array.
        // Ends if the next node has the same or higher level than the given node.
        for (let i = node.position + 1; !!nodes[i] && nodes[i].level >= node.level + 1; ++i) {
            const nextNode = nodes[i];
            // The next node is a child if the level is one higher than the given node.
            if (nextNode.level === node.level + 1) {
                // Makes the child nodes recursively.
                const child = this.buildBranchFromFlatTree(nextNode, nodes, 0);
                length += child.length;
                children.push(child.node);
            }
        }

        // Makes the node with child nodes.
        const osNode: TreeIdNode = {
            id: node.id,
            children: children.length > 0 ? children : undefined
        };

        // Returns the built node and increase the length by one.
        return { node: osNode, length: ++length };
    }
}
