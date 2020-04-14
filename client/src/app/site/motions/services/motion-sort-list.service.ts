import { Injectable } from '@angular/core';

import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';

import { OpenSlidesStatusService } from 'app/core/core-services/openslides-status.service';
import { StorageService } from 'app/core/core-services/storage.service';
import { Deferred } from 'app/core/promises/deferred';
import { BaseSortListService } from 'app/core/ui-services/base-sort-list.service';
import { OsSortingDefinition, OsSortingOption } from 'app/core/ui-services/base-sort.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { ViewMotion } from '../models/view-motion';

/**
 * Sorting service for the motion list
 */
@Injectable({
    providedIn: 'root'
})
export class MotionSortListService extends BaseSortListService<ViewMotion> {
    /**
     * set the storage key name
     */
    protected storageKey = 'MotionList';

    /**
     * Hold the default motion sorting
     */
    private defaultMotionSorting: string;

    /**
     * To wait until the default motion was loaded once
     */
    private readonly defaultSortingLoaded: Deferred<void> = new Deferred();

    /**
     * Define the sort options
     */
    protected motionSortOptions: OsSortingOption<ViewMotion>[] = [
        { property: 'weight', label: 'Call list' },
        { property: 'identifier' },
        { property: 'title' },
        { property: 'submitters' },
        { property: 'category', sortFn: this.categorySortFn },
        { property: 'motion_block_id', label: 'Motion block' },
        { property: 'state' },
        { property: 'creationDate', label: _('Creation date') },
        { property: 'lastChangeDate', label: _('Last modified') }
    ];

    /**
     * Constructor.
     *
     * @param translate required by parent
     * @param store required by parent
     * @param config set the default sorting according to OpenSlides configuration
     */
    public constructor(
        translate: TranslateService,
        store: StorageService,
        OSStatus: OpenSlidesStatusService,
        config: ConfigService
    ) {
        super(translate, store, OSStatus);

        config.get<string>('motions_motions_sorting').subscribe(defSortProp => {
            if (defSortProp) {
                this.defaultMotionSorting = defSortProp;
                this.defaultSortingLoaded.resolve();
            }
        });
    }

    protected getSortOptions(): OsSortingOption<ViewMotion>[] {
        return this.motionSortOptions;
    }

    /**
     * Required by parent
     *
     * @returns the default sorting strategy
     */
    protected async getDefaultDefinition(): Promise<OsSortingDefinition<ViewMotion>> {
        await this.defaultSortingLoaded;
        return {
            sortProperty: this.defaultMotionSorting as keyof ViewMotion,
            sortAscending: true
        };
    }

    /**
     * Custom function to sort the categories by the `category_weight` of the motion.
     *
     * @param itemA The first item to sort
     * @param itemB The second item to sort
     * @param ascending If the sorting should be in ascended or descended order
     *
     * @returns {number} The result of comparing.
     */
    private categorySortFn(itemA: ViewMotion, itemB: ViewMotion, ascending: boolean): number {
        if (itemA.category_id === itemB.category_id) {
            return itemA.category_weight < itemB.category_weight === ascending ? -1 : 1;
        } else {
            return itemA.category.weight < itemB.category.weight === ascending ? -1 : 1;
        }
    }
}
