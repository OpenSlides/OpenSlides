import { Injectable } from '@angular/core';

import { BaseFilterListService, OsFilter } from 'app/core/ui-services/base-filter-list.service';
import { Mediafile } from 'app/shared/models/mediafiles/mediafile';
import { ViewMediafile } from '../models/view-mediafile';
import { StorageService } from 'app/core/core-services/storage.service';
import { MediafileRepositoryService } from 'app/core/repositories/mediafiles/mediafile-repository.service';
import { OperatorService } from 'app/core/core-services/operator.service';

@Injectable({
    providedIn: 'root'
})
export class MediafileFilterListService extends BaseFilterListService<Mediafile, ViewMediafile> {
    protected name = 'Mediafile';

    /**
     * A filter checking if a file is a pdf or not
     */
    public pdfOption: OsFilter = {
        property: 'type',
        label: 'Is PDF',
        options: [
            {
                condition: 'application/pdf',
                label: 'Is PDF file'
            },
            {
                condition: null,
                label: 'Is no PDF file'
            }
        ]
    };

    /**
     * A filter checking if a file is hidden. Only included if the operator has permission to see hidden files
     */
    public hiddenOptions: OsFilter = {
        property: 'is_hidden',
        label: 'Hidden',
        options: [{ condition: true, label: 'is hidden' }, { condition: false, label: 'is not hidden', isActive: true }]
    };

    /**
     * Constructor. Sets the filter options according to permissions
     * @param store
     * @param repo
     * @param operator
     */
    public constructor(store: StorageService, repo: MediafileRepositoryService, operator: OperatorService) {
        super(store, repo);
        const filterOptions = operator.hasPerms('mediafiles.can_see_hidden')
            ? [this.hiddenOptions, this.pdfOption]
            : [this.pdfOption];
        this.updateFilterDefinitions(filterOptions);
    }
}
