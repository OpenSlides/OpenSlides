import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { OSTreeNode, TreeService } from 'app/core/ui-services/tree.service';
import { ViewItem } from '../models/view-item';

/**
 * pdfMake structure for a content line in the pdf document.
 */
interface AgendaTreePdfEntry {
    style: string;
    columns: { width?: number; text: string }[];
}

/**
 * Converts a list of agenda items to pdf, indenting according to a hierarchy tree.
 * Provides the public method `agendaListToDocDef(items: ViewItems[])` which should be convenient to use.
 *
 * @example
 * ```ts
 * const pdfMakeCompatibleDocDef = this.AgendaPdfService.agendaListToDocDef(this.dataSource.data);
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class AgendaPdfService {
    /**
     * Constructor
     *
     * @param translate handle translations
     * @param treeService create hierarchy between items
     */
    public constructor(private translate: TranslateService, private treeService: TreeService) {}

    /**
     * Creates pdfMake definitions for a agenda list pdf from the given agenda items
     *
     * @param items A list of viewItems to be included in this agenda list. Items with the property 'hidden'
     * will be ignored, all other items will be sorted by their parents and weight
     * @returns definitions ready to be opened or exported via {@link PdfDocumentService}
     */
    public agendaListToDocDef(items: ViewItem[]): object {
        const tree: OSTreeNode<ViewItem>[] = this.treeService.makeTree(items, 'weight', 'parent_id');
        const title = {
            text: this.translate.instant('Agenda'),
            style: 'title'
        };
        const entries = this.createEntries(tree);
        return [title, entries];
    }

    /**
     * Traverses the given nodeTree and creates an array of entries for all items
     *
     * @param tree
     * @returns hierarchical pdfMake definitions for topic entries
     */
    private createEntries(tree: OSTreeNode<ViewItem>[]): AgendaTreePdfEntry[] {
        const content: AgendaTreePdfEntry[] = [];
        tree.forEach(treeitem => content.push(...this.parseItem(treeitem, 0)));
        return content;
    }

    /**
     * Parses an entry line and triggers parsing of any children
     * Items with 'is_hidden' and their subitems are not exported
     *
     * @param nodeItem the item for the head line
     * @param level: The hierarchy index (beginning at 0 for top level agenda topics)
     * @returns pdfMake definitions for the number/title strings, indented according to hierarchy
     */
    private parseItem(nodeItem: OSTreeNode<ViewItem>, level: number): AgendaTreePdfEntry[] {
        const itemList: AgendaTreePdfEntry[] = [];
        if (!nodeItem.item.item.is_hidden) {
            // don't include hidden items and their subitems
            const resultString: AgendaTreePdfEntry = {
                style: level ? 'listChild' : 'listParent',
                columns: [
                    {
                        width: level * 15,
                        text: ''
                    },
                    {
                        width: 60,
                        text: nodeItem.item.item_number
                    },
                    {
                        text: nodeItem.item.contentObject.getTitle()
                    }
                ]
            };
            itemList.push(resultString);
            if (nodeItem.children && nodeItem.children.length) {
                nodeItem.children.forEach(child => {
                    itemList.push(...this.parseItem(child, level + 1));
                });
            }
        }
        return itemList;
    }
}
