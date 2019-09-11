import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { Identifiable } from 'app/shared/models/base/identifiable';
import { Displayable } from 'app/site/base/displayable';
import { BaseSortService } from './base-sort.service';
import { FlatNode } from './tree.service';

/**
 * Sorting service for trees.
 *
 * Contains base functions to sort a tree by different properties.
 */
@Injectable({
    providedIn: 'root'
})
export class TreeSortService<T extends Identifiable & Displayable> extends BaseSortService<T> {
    /**
     * Constructor.
     * Calls the `super()`-method.
     *
     * @param translate The reference to the `TranslateService`
     */
    public constructor(protected translate: TranslateService) {
        super(translate);
    }

    /**
     * Function to sort the passed source of a tree
     * and resets some properties like `level`, `expandable`, `position`.
     *
     * @param sourceData The source array of `FlatNode`s.
     * @param property The property, the array will be sorted by.
     * @param ascending Boolean, if the array should be sorted in ascending order.
     *
     * @returns {FlatNode<T>[]} The sorted array.
     */
    public sortTree(sourceData: FlatNode<T>[], property: keyof T, ascending: boolean = true): FlatNode<T>[] {
        return sourceData
            .sort((nodeA, nodeB) => {
                const itemA = nodeA.item;
                const itemB = nodeB.item;
                return this.sortItems(itemA, itemB, property, ascending);
            })
            .map((node, index) => {
                node.level = 0;
                node.position = index;
                node.expandable = false;
                return node;
            });
    }
}
