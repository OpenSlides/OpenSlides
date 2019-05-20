import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { _ } from 'app/core/translate/translation-marker';
import { BaseSortListService, OsSortingDefinition, OsSortingOption } from 'app/core/ui-services/base-sort-list.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { Deferred } from 'app/core/deferred';
import { StorageService } from 'app/core/core-services/storage.service';
import { ViewMotion } from '../models/view-motion';

/**
 * Sorting service for the motion list
 */
@Injectable({
    providedIn: 'root'
})
export class MotionSortListService extends BaseSortListService<ViewMotion> {
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
    public sortOptions: OsSortingOption<ViewMotion>[] = [
        { property: 'weight', label: 'Call list' },
        { property: 'identifier' },
        { property: 'title' },
        { property: 'submitters' },
        { property: 'category' },
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
    public constructor(translate: TranslateService, store: StorageService, private config: ConfigService) {
        super('Motion', translate, store);

        this.config.get<string>('motions_motions_sorting').subscribe(defSortProp => {
            if (defSortProp) {
                this.defaultMotionSorting = defSortProp;
                this.defaultSortingLoaded.resolve();
            }
        });
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
}
